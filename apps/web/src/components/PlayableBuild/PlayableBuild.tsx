import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button/Button";
import styles from "./PlayableBuild.module.scss";

interface PlayableBuildProps {
	title: string;
	/** Address of the hosted build. */
	src: string;
}

/**
 * A hosted build that can be played in the page or full screen. The build is
 * only loaded once the visitor asks to play it.
 */
export function PlayableBuild({ title, src }: PlayableBuildProps) {
	const player = useRef<HTMLDivElement>(null);
	const frame = useRef<HTMLIFrameElement>(null);
	const [playing, setPlaying] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);

	useEffect(() => {
		const sync = () =>
			setFullscreen(document.fullscreenElement === player.current);
		document.addEventListener("fullscreenchange", sync);
		return () => document.removeEventListener("fullscreenchange", sync);
	}, []);

	// Hand the keyboard to the build, both when it starts and when the
	// full-screen button has taken focus away from it.
	const focusFrame = () => frame.current?.focus();

	const toggleFullscreen = async () => {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else await player.current?.requestFullscreen();
		} catch {
			// The browser refused; the build stays playable in the page.
		}
		focusFrame();
	};

	return (
		<div
			ref={player}
			className={styles.player}
		>
			<div className={styles.stage}>
				{playing ? (
					<iframe
						ref={frame}
						className={styles.frame}
						src={src}
						title={title}
						allow="fullscreen; autoplay; gamepad"
						sandbox="allow-scripts allow-same-origin allow-pointer-lock"
						onLoad={focusFrame}
					/>
				) : (
					<div className={styles.poster}>
						<span className={styles.posterTitle}>{title}</span>
						<Button
							variant="primary"
							onClick={() => setPlaying(true)}
						>
							Play
						</Button>
					</div>
				)}
			</div>
			<div className={styles.controls}>
				<a
					className={styles.external}
					href={src}
					target="_blank"
					rel="noreferrer"
				>
					Open in new tab ↗
				</a>
				{playing && <Button onClick={() => setPlaying(false)}>Stop</Button>}
				{document.fullscreenEnabled && (
					<Button onClick={toggleFullscreen}>
						{fullscreen ? "Exit full screen" : "Full screen"}
					</Button>
				)}
			</div>
		</div>
	);
}
