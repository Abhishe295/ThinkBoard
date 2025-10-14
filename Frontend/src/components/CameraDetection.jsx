import React from 'react'

const CameraDetection = () => {
    const handleCameraDetect = async () => {
  if (!userData || !userData._id) {
    setResult({ error: "Please log in first." });
    return;
  }

  setResult(null);
  setLoading(true);
  setActiveMethod('camera');

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;

    // Wait for video to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Capture image from video
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    const formData = new FormData();
    formData.append('user_id', userData._id);
    formData.append('image', blob, 'snapshot.jpg');

    const res = await axios.post(`${backendUrl}/api/emotion/camera-image`, formData);
    setResult(res.data);
    fetchEmotionHistory();
  } catch (err) {
    console.error("Camera detection error:", err);
    setResult({ error: "Camera detection failed." });
  } finally {
    stopCamera();
    setLoading(false);
    setActiveMethod(null);
  }
};
  return (
    <div>
      
    </div>
  )
}

export default CameraDetection
