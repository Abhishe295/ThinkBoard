import axios from 'axios';
import userModel from '../models/userModel.js';
import FormData from "form-data";
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import moment from 'moment';
import _ from 'lodash';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

const PYTHON_API = isProduction ? process.env.PYTHON_API_PROD : process.env.PYTHON_API_DEV;
const upload = multer({ dest: "uploads/"});

const ensureDirectoryExists = (dirPath) => {
  if(!fs.existsSync(dirPath)){
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export const detectEmotionFromImage = async (req, res) => {
  try {
    const { user_id } = req.body;
    const imageUrl = req.file?.path; // this is a Cloudinary URL

    if (!imageUrl) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const folderPath = path.join('uploads','user_profiles');
    ensureDirectoryExists(folderPath);

    // Download image from Cloudinary
    const tempPath = path.join('uploads', `${req.file.filename}.jpg`);
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Prepare formData for Python
    const formData = new FormData();
    formData.append('user_id', user_id);
    formData.append('file', fs.createReadStream(tempPath));

    const pythonResponse = await axios.post(
      PYTHON_API + '/detect-emotion/image',
      formData,
      { headers: formData.getHeaders() }
    );

    // Cleanup
    try {
      fs.unlinkSync(tempPath);
    } catch (e) {
      console.warn("Temp file cleanup failed:", e.message);
    }

    res.json(pythonResponse.data);
  } catch (err) {
    console.error("Image detection error:", err.response?.data || err.message);
    res.status(500).json({ error: "Image detection failed" });
  }
};


export const detectEmotionVoice = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);

    const userId = req.body.userId || req.body.user_id;


    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("file", fs.createReadStream(req.file.path));

    console.log("FormData fields:", formData.getHeaders());


    // Get headers including Content-Length
    const headers = formData.getHeaders();
    const contentLength = await new Promise((resolve, reject) => {
      formData.getLength((err, length) => {
        if (err) reject(err);
        else resolve(length);
      });
    });
    headers["Content-Length"] = contentLength;

    console.log("Sending to Python API:", {
  url: PYTHON_API + "/detect-emotion/voice",
  userId,
  filePath: req.file.path
});


    const response = await axios.post(
      PYTHON_API + "/detect-emotion/voice",
      formData,
      { headers }
    );

    const data = response.data;

    // Save last emotion in Mongo
    if (data?.history?.length > 0) {
      await userModel.findByIdAndUpdate(userId, {
        $push: { emotionHistory: data.history[data.history.length - 1] },
      });
    }

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    res.json(data);
  } catch (err) {
    console.error("Voice detection error:", err.response?.data || err.message);
    res.status(500).json({ error: "Voice detection failed" });
  }
};

export const detectEmotionForm = async (req, res) => {
  try {
    const { user_id, phq9, gad7 } = req.body;

    if (!Array.isArray(phq9) || !Array.isArray(gad7)) {
      return res.status(400).json({ error: "phq9 and gad7 must be arrays of numbers" });
    }

    const response = await axios.post(PYTHON_API + "/detect-emotion/form", {
      user_id: user_id,
      phq9,
      gad7
    });

    const data = response.data;

    // Save last form result in Mongo
    if (data?.history?.length > 0) {
      await userModel.findByIdAndUpdate(user_id, {
        $push: { emotionHistory: data.history[data.history.length - 1] },
      });
    }

    res.json(data);
  } catch (err) {
    console.error("Form detection error:", err.response?.data || err.message);
    res.status(500).json({ error: "Form detection failed" });
  }
};



export const getEmotionHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findById(userId);
    const history = user?.emotionHistory || [];

    if (history.length === 0) {
      return res.json({
        user_id: userId,
        message: "No emotion data available."
      });
    }

    const cutoff = moment().subtract(30, "days");
    const recentHistory = history.filter(entry =>
      moment(entry.timestamp).isAfter(cutoff)
    );

    if (recentHistory.length === 0) {
      return res.json({
        user_id: userId,
        message: "No emotion data available in the last 30 days."
      });
    }

    // --- Helper to get top emotion safely ---
    const getTopEmotion = (entries) => {
      const counts = _.countBy(entries, "emotion");
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return sorted.length > 0 ? sorted[0][0] : null;
    };

    // --- DAILY SUMMARY ---
    const dailyGroups = _.groupBy(recentHistory, entry =>
      moment(entry.timestamp).format("YYYY-MM-DD")
    );
    const daily_summary = _.mapValues(dailyGroups, getTopEmotion);

    // --- WEEKLY SUMMARY ---
    const weeklyGroups = _.groupBy(recentHistory, entry =>
      `${moment(entry.timestamp).isoWeekYear()}-W${moment(entry.timestamp).isoWeek()}`
    );
    const weekly_summary = _.mapValues(weeklyGroups, getTopEmotion);

    // --- MONTHLY SUMMARY ---
    const monthlyGroups = _.groupBy(recentHistory, entry =>
      moment(entry.timestamp).format("YYYY-MM")
    );
    const monthly_summary = _.mapValues(monthlyGroups, getTopEmotion);

    // --- TOP EMOTIONS ---
    const emotionCounts = _.countBy(recentHistory, "emotion");
    const top_emotions_last_30_days = Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    return res.json({
      user_id: userId,
      daily_summary,
      weekly_summary,
      monthly_summary,
      top_emotions_last_30_days,
      total_entries_analyzed: recentHistory.length
    });

  } catch (error) {
    console.error("Error generating emotion summary:", error.message);
    res.status(500).json({ error: "Failed to generate emotion summary" });
  }
};

export const getSpotifyToken = async (req,res)=>{
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`
        }
      }
    );

    res.json({ access_token: response.data.access_token });


  } catch (err) {
    console.error("Spotify token error:", err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get token' });
  }
}

export const searchSpotifyTracks = async (req, res) => {
  try {
    const { query, limit = 15 } = req.query;

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`
        }
      }
    );

    const token = tokenRes.data.access_token;

    const searchRes = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        q: query,
        type: 'track',
        limit,
        market: 'US'
      }
    });

    const tracks = searchRes.data.tracks.items.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      duration: Math.floor(track.duration_ms / 1000),
      image: track.album.images[0]?.url || '',
      audio: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      popularity: track.popularity
    }));

    res.json({ tracks });
  } catch (err) {
    console.error('Spotify search error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
};

export const getSpotifyRecommendations = async (req, res) => {
  try {
    const { seedGenres, limit = 15, ...targetAudioFeatures } = req.query;

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`
        }
      }
    );

    const token = tokenRes.data.access_token;

    const params = {
      seed_genres: seedGenres.split(',').slice(0, 5).join(','),
      limit,
      market: 'US',
      ...targetAudioFeatures
    };

    const recRes = await axios.get('https://api.spotify.com/v1/recommendations', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });

    const tracks = recRes.data.tracks.map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map(a => a.name).join(', '),
      duration: Math.floor(track.duration_ms / 1000),
      image: track.album.images[0]?.url || '',
      audio: track.preview_url,
      spotifyUrl: track.external_urls.spotify,
      popularity: track.popularity
    }));

    res.json({ tracks });
  } catch (err) {
    console.error('Spotify recommendation error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
};

export const getAvailableGenres = async (req, res) => {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`
        }
      }
    );

    const token = tokenRes.data.access_token;
    console.log("token:", token);

    const genreRes = await axios.get(
      'https://api.spotify.com/v1/recommendations/available-genre-seeds',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Defensive check
    if (!genreRes.data || !genreRes.data.genres) {
      console.warn("Spotify returned no genres:", genreRes.data);
      return res.status(404).json({ error: 'No genres found from Spotify' });
    }

    res.json({ genres: genreRes.data.genres });
  } catch (error) {
    console.error('Spotify genre error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch genres',
      details: error.response?.data || error.message
    });
  }
};


