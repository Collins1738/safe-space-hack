import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";

function AppInner2() {
	const videoHeight = 480;
	const videoWidth = 640;
	const [initializing, setInitializing] = useState(false);
	const videoRef = useRef();
	const canvasRef = useRef();

	useEffect(() => {
		const loadModels = async () => {
			const MODEL_URL = process.env.PUBLIC_URL + "/models";
			setInitializing(true);
			Promise.all([
				faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
				faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
				faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
				faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
			])
				.then(startVideo)
				.catch((err) => {
					console.log("error loading models");
					console.log(err.message);
				});
		};
		loadModels();
	}, []);

	const startVideo = async () => {
		navigator.getUserMedia(
			{ video: true },
			(stream) => {
				videoRef.current.srcObject = stream;
			},
			(err) => {
				console.log("error", err.message);
			}
		);
	};

	const handleVideoOnPlay = () => {
		setInterval(async () => {
			if (initializing) {
				setInitializing(false);
			}
			canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(
				videoRef.current
			);
			const displaySize = {
				width: videoWidth,
				height: videoHeight,
			};
			faceapi.matchDimensions(canvasRef.current, displaySize);
			const detections = await faceapi
				.detectAllFaces(
					videoRef.current,
					new faceapi.TinyFaceDetectorOptions()
				)
				.withFaceLandmarks()
				.withFaceExpressions();

			const resizeDetections = faceapi.resizeResults(
				detections,
				displaySize
			);
			canvasRef.current
				.getContext("2d")
				.clearRect(0, 0, videoWidth, videoHeight);
			faceapi.draw.drawDetections(canvasRef.current, resizeDetections);
			faceapi.draw.drawFaceLandmarks(canvasRef.current, resizeDetections);
			faceapi.draw.drawFaceExpressions(
				canvasRef.current,
				resizeDetections
			);
			// console.log(detections);
		}, 10);
	};
	return (
		<div className="App">
			<div>
				<span>{initializing ? "initializing" : "ready"}</span>
			</div>
			<div className="app_container">
				<video
					ref={videoRef}
					autoPlay
					muted
					height={videoHeight}
					width={videoWidth}
					onPlay={handleVideoOnPlay}
				></video>
				<canvas ref={canvasRef} className="canvas" />
			</div>
		</div>
	);
}

function App() {
	return (
		<div className="App">
			<h1>Hi, this is safe space's emotion recognition software</h1>
			<AppInner2 />
		</div>
	);
}

export default App;
