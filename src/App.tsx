import { useEffect, useRef, useState } from 'react';
import { animated, useSpring } from '@react-spring/web';
import css from './app.module.css';

const CONFETTI_PIECES = Array.from({ length: 28 }, (_, index) => index);

export default function Page() {
    const [timer, setTimer] = useState("10.000");
    const [enabled, setEnabled] = useState(false);
    const [status, setStatus] = useState<"stopped" | "success" | "fail">("stopped");
    const progress = Math.min(1, Math.max(0, Number(timer) / 10));
    const colors = useSpring({
        "track": status === "stopped" ? "#3e3e3e" : status === "fail" ? "#441010" : "#104410",
        "progress": status === "stopped" ? "#ffffff" : status === "fail" ? "#ff2a2a" : "#2aff2a",
        "config": { "duration": 300 },
    });
    const [description, descriptionApi] = useSpring(() => ({
        "opacity": 1,
        "config": { "duration": 300 }
    }), []);
    const [disableClick, setDisableClick] = useState(false);

    const timeStart = useRef(-1);
    const timeEnd = useRef(-1);
    const frameId = useRef(-1);

    // timeout
    const tooLong = useRef(-1);

    const startTimer = () => {
        // eslint-disable-next-line react-hooks/purity
        timeStart.current = performance.now();
        timeEnd.current = timeEnd.current + 10000;

        const render = () => {
            const elapsed = performance.now() - timeStart.current;
            const remaining = 10000 - elapsed;

            setTimer((remaining / 1000).toFixed(3));
            frameId.current = requestAnimationFrame(render);
        };

        render();

        descriptionApi.start({ "opacity": 0 });

        tooLong.current = setTimeout(endTimer, 12000);
    };

    const endTimer = () => {
        cancelAnimationFrame(frameId.current);
        setEnabled(false);

        const diff = performance.now() - timeStart.current - 10000;

        if (Number((diff / 1000).toFixed(3)) === 0) {
            setStatus("success");
        } else {
            setStatus("fail");
        }

        setDisableClick(true);
        descriptionApi.start({ "opacity": 0 });
        setTimer((-(diff / 1000)).toFixed(3));
        clearTimeout(tooLong.current);

        setTimeout(() => {
            setStatus("stopped");
            timeStart.current = -1;
            timeEnd.current = -1;
            descriptionApi.start({ "opacity": 1 });
            setTimer("10.000");
            setDisableClick(false);
        }, 2500);
    };

    useEffect(() => {
        const cb = (key: KeyboardEvent) => {
            if (key.repeat) return;
            if (disableClick) return;

            if (key.key !== " ") return;
            key.preventDefault();
            if (!enabled) {
                setEnabled(true);
                startTimer();
                return;
            }

            setEnabled(false);
            endTimer();
            return;
        };

        window.addEventListener("keydown", cb);

        return () => window.removeEventListener("keydown", cb);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, disableClick]);

    return <div
        className={css.container}
        onClick={() => {
            if (disableClick) return;
            if (!enabled) {
                setEnabled(true);
                startTimer();
                return;
            }

            setEnabled(false);
            endTimer();
            return;
        }}
    >
        {status === 'success' && (
            <div className={css.confettiLayer} aria-hidden="true">
                {CONFETTI_PIECES.map((piece) => (
                    <span key={piece} className={css.confettiPiece} />
                ))}
            </div>
        )}
        <div className={css.timerFace}>
            <svg className={css.ring} viewBox="0 0 100 100">
                <animated.circle
                    cx={50}
                    cy={50}
                    r={47}
                    style={{ "stroke": colors.track }}
                />
                <animated.circle
                    className={css.progress}
                    style={{ "stroke": colors.progress }}
                    cy={50}
                    cx={50}
                    r={47}
                    pathLength={1}
                    strokeDasharray="1 1"
                    strokeDashoffset={progress - 1}
                    transform="rotate(-90 50 50)"
                    visibility={progress > 0 ? 'visible' : 'hidden'}
                />
            </svg>
            <animated.span className={css.timer} style={{ "color": colors.progress }}>{timer}</animated.span>
            <animated.span className={css.description} style={{ "opacity": description.opacity }}>스페이스 바를 누르거나 화면을 클릭해주세요!</animated.span>
        </div>
    </div>;
}
