import "./App.css";
import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import Highcharts from "highcharts";

function Charts({ data }) {
	const [hc, setHc] = useState(null);
	const [hc_angry, setHc_angry] = useState(null);
	const [hc_rest, setHc_rest] = useState(null);
	useEffect(() => {
		highChartsRender();
	}, []);

	useEffect(() => {
		if (!hc || !hc_angry || !hc_rest || !data) return;

		const shift = hc.series[0].data.length > 20;
		hc.series[0].addPoint(data.happy, true, shift);
		hc_angry.series[0].addPoint(data.angry, true, shift);
		hc_rest.series[0].addPoint(data.sad, true, shift);
		hc_rest.series[1].addPoint(data.disgusted, true, shift);
		hc_rest.series[2].addPoint(data.fearful, true, shift);

		hc_rest.series[3].addPoint(data.surprised, true, shift);
		hc_rest.series[4].addPoint(data.neutral, true, shift);
	}, [data, hc, hc_angry, hc_rest]);

	const highChartsRender = () => {
		const hc = Highcharts.chart({
			chart: {
				renderTo: "happy-chart",
				type: "spline",
			},
			title: {
				verticalAlign: "middle",
				floating: true,
				text: "Happy emotion",
				style: {
					fontSize: "10px",
				},
			},
			series: [
				{
					name: "Happy",
				},
			],
		});

		const hc_angry = Highcharts.chart({
			chart: {
				renderTo: "angry-chart",
				type: "spline",
			},
			title: {
				verticalAlign: "middle",
				floating: true,
				text: "Angry emotion",
				style: {
					fontSize: "10px",
				},
			},
			series: [
				{
					name: "Angry",
				},
			],
		});

		const hc_rest = Highcharts.chart({
			chart: {
				renderTo: "rest-chart",
				type: "spline",
			},
			title: {
				verticalAlign: "middle",
				floating: true,
				text: "Other emotions",
				style: {
					fontSize: "10px",
				},
			},
			series: [
				{
					name: "Sad",
					color: "brown",
				},
				{ name: "Disgust", color: "blue" },
				{ name: "Fearful", color: "red" },
				{ name: "Surprised", color: "purple" },
				{ name: "Neutral", color: "green" },
			],
		});
		setHc(hc);
		setHc_angry(hc_angry);
		setHc_rest(hc_rest);
	};
	return (
		<div className="charts">
			<div id="happy-chart"></div>
			<div id="angry-chart"></div>
			<div id="rest-chart"></div>
		</div>
	);
}

function AppInner2() {
	const videoHeight = 480;
	const videoWidth = 640;
	const [initializing, setInitializing] = useState(false);
	const videoRef = useRef();
	const canvasRef = useRef();
	const [showDetections, setShowDetections] = useState(true);
	const [showLandmarks, setShowLandmarks] = useState(true);
	const [showExpressions, setShowExpressions] = useState(true);
	const [data, setData] = useState(null);

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

	useEffect(() => {
		if (initializing) return;
		const timer = setInterval(async () => {
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
			showDetections &&
				faceapi.draw.drawDetections(
					canvasRef.current,
					resizeDetections
				);
			showLandmarks &&
				faceapi.draw.drawFaceLandmarks(
					canvasRef.current,
					resizeDetections
				);
			showExpressions &&
				faceapi.draw.drawFaceExpressions(
					canvasRef.current,
					resizeDetections
				);
			if (detections[0]) {
				setData(detections[0].expressions);
			}
		}, 500);

		return () => clearInterval(timer);
	}, [showDetections, showLandmarks, showExpressions, initializing]);

	return (
		<div className="App">
			<div>{initializing ? "Loading...." : "Ready!!!"}</div>
			<div className="outer-container">
				<div className="flex-1">
					<div className="app_container">
						{!initializing && (
							<div className="canvas behind">
								Hi, your webcam video should show here. If you
								can't see your webcam video, your webcam may not
								be turned on. If you don't see the permission to
								turn it on, please try a different browser
								preferrably Google Chrome
							</div>
						)}
						<video
							className="video-container"
							ref={videoRef}
							autoPlay
							muted
							height={videoHeight}
							width={videoWidth}
							onPlay={() => setInitializing(false)}
						></video>
						<canvas ref={canvasRef} className="canvas" />
					</div>
					<div>
						<button
							onClick={() => {
								setShowDetections(!showDetections);
							}}
						>
							{showDetections
								? "Hide detections"
								: "Show detections"}
						</button>
						<button
							onClick={() => {
								setShowLandmarks(!showLandmarks);
							}}
						>
							{showLandmarks
								? "Hide landmarks"
								: "Show landmarks"}
						</button>
						<button
							onClick={() => {
								setShowExpressions(!showExpressions);
							}}
						>
							{showExpressions
								? "Hide expressions"
								: "Show expressions"}
						</button>
					</div>
				</div>
				<div className="flex-1 chart-outer">
					<Charts data={data} />
				</div>
			</div>
		</div>
	);
}

function App() {
	return (
		<div className="App">
			<h1>Hi, this is SafeSpace emotion recognition software.</h1>
			<h3>Play around with it and have fun!</h3>
			<AppInner2 />
		</div>
	);
}

export default App;
/**
 * happy
 * angry
 * sad
 * fearful
 * disgusted
 * surprised
 * neutral
 */
