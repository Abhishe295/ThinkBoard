import express from 'express';
import { detectEmotionForm, detectEmotionFromImage, detectEmotionVoice, getAvailableGenres, getEmotionHistory, getSpotifyRecommendations, getSpotifyToken, searchSpotifyTracks } from '../controllers/emotionController.js';
import upload from '../middleware/upload.js';


const emotionRoutes = express.Router();

// emotionRoutes.post("/camera", detectEmotionCamera);
emotionRoutes.post("/voice", upload.single("file"), detectEmotionVoice);
emotionRoutes.post('/form',detectEmotionForm);
emotionRoutes.get("/history/:userId",  getEmotionHistory);
emotionRoutes.get('/spotify-token',getSpotifyToken);
emotionRoutes.get('/spotify-search', searchSpotifyTracks);
emotionRoutes.get('/spotify-recommendations', getSpotifyRecommendations);
emotionRoutes.get('/spotify-genres', getAvailableGenres);
emotionRoutes.post('/camera-image',upload.single("image"),detectEmotionFromImage);

export default emotionRoutes;

