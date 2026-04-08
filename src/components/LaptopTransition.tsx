"use client";

import { useRef } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    MotionValue,
} from "framer-motion";
import styles from "./LaptopTransition.module.css";

const CODE_LINES = [
    { w: "55%", color: "#82aaff" },
    { w: "38%", color: "#c792ea" },
    { w: "70%", color: "#eeffff" },
    { w: "45%", color: "#c3e88d" },
    { w: "30%", color: "#c792ea" },
    { w: "60%", color: "#82aaff" },
    { w: "50%", color: "#ffcb6b" },
    { w: "42%", color: "#eeffff" },
    { w: "65%", color: "#c3e88d" },
    { w: "35%", color: "#82aaff" },
    { w: "55%", color: "#c792ea" },
    { w: "48%", color: "#eeffff" },
];

interface CardDef {
    id: string;
    label: string;
    title: string;
    sub: string;
    detail: string;
    accent: string;
    ex: number;
    ey: number;
    inStart: number;
    inEnd: number;
    outStart: number;
    outEnd: number;
}

const CARDS: CardDef[] = [
    {
        id: "exp",
        label: "Experience",
        title: "4+",
        sub: "Years Engineering",
        detail: "Full-Stack · Distributed Systems",
        accent: "#82aaff",
        ex: -360, ey: -240,
        inStart: 0.22, inEnd: 0.42,
        outStart: 0.68, outEnd: 0.82,
    },
    {
        id: "sys",
        label: "Systems",
        title: "5+",
        sub: "Architectures Shipped",
        detail: "Kafka · Microservices · Event-Driven",
        accent: "#c792ea",
        ex: 360, ey: -240,
        inStart: 0.28, inEnd: 0.48,
        outStart: 0.68, outEnd: 0.82,
    },
    {
        id: "perf",
        label: "Performance",
        title: "10×",
        sub: "API Speed Improvements",
        detail: "Query Opt · Caching · Async Pipelines",
        accent: "#c3e88d",
        ex: -360, ey: 240,
        inStart: 0.34, inEnd: 0.54,
        outStart: 0.68, outEnd: 0.82,
    },
    {
        id: "proj",
        label: "Projects",
        title: "20+",
        sub: "Products Delivered",
        detail: "Node.js · React · AWS · Docker",
        accent: "#ffcb6b",
        ex: 360, ey: 240,
        inStart: 0.40, inEnd: 0.60,
        outStart: 0.68, outEnd: 0.82,
    },
];

/* ── Card sub-component (hooks called at top level here) ── */
function FlyingCard({ card, raw }: { card: CardDef; raw: MotionValue<number> }) {
    const x  = useTransform(raw, [card.inStart, card.inEnd], [0, card.ex]);
    const y  = useTransform(raw, [card.inStart, card.inEnd], [0, card.ey]);
    const sc = useTransform(raw, [card.inStart, card.inStart + 0.14], [0.3, 1]);
    const op = useTransform(
        raw,
        [card.inStart - 0.04, card.inStart + 0.1, card.outStart, card.outEnd],
        [0, 1, 1, 0]
    );

    return (
        <motion.div
            className={styles.card}
            style={{ x, y, opacity: op, scale: sc }}
        >
            <span className={styles.cardAccent} style={{ background: card.accent }} />
            <span className={styles.cardLabel}>{card.label}</span>
            <p className={styles.cardTitle} style={{ color: card.accent }}>{card.title}</p>
            <p className={styles.cardSub}>{card.sub}</p>
            <p className={styles.cardDetail}>{card.detail}</p>
        </motion.div>
    );
}

/* ── Main component ───────────────────────────────────── */
export default function LaptopTransition() {
    const containerRef = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const raw = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });

    const sectionOpacity = useTransform(raw, [0, 0.05, 0.82, 1], [0, 1, 1, 0]);

    const headY  = useTransform(raw, [0.03, 0.14], [28, 0]);
    const headOp = useTransform(raw, [0.03, 0.14, 0.70, 0.84], [0, 1, 1, 0]);

    const laptopScale = useTransform(raw, [0.06, 0.24], [0.52, 1]);
    const laptopRotX  = useTransform(raw, [0.06, 0.24], [22, 0]);
    const laptopOp    = useTransform(raw, [0.05, 0.16, 0.74, 0.90], [0, 1, 1, 0]);
    const glowOp      = useTransform(raw, [0.10, 0.28], [0, 1]);

    return (
        <div ref={containerRef} className={styles.container}>
            <motion.div className={styles.sticky} style={{ opacity: sectionOpacity }}>

                {/* heading */}
                <motion.div className={styles.heading} style={{ y: headY, opacity: headOp }}>
                    <span className={styles.headLabel}>The Craft</span>
                    <p className={styles.headLine}>Built to perform.</p>
                </motion.div>

                {/* scene */}
                <div className={styles.scene}>
                    {/* flying cards */}
                    {CARDS.map((card) => (
                        <FlyingCard key={card.id} card={card} raw={raw} />
                    ))}

                    {/* laptop */}
                    <motion.div
                        className={styles.laptopWrap}
                        style={{
                            scale: laptopScale,
                            rotateX: laptopRotX,
                            opacity: laptopOp,
                            transformPerspective: 1400,
                        }}
                    >
                        <div className={styles.screen}>
                            <div className={styles.notch} />
                            <div className={styles.bezel}>
                                <motion.div
                                    className={styles.screenGlow}
                                    style={{ opacity: glowOp }}
                                />
                                <div className={styles.codeLines}>
                                    {CODE_LINES.map((line, i) => (
                                        <div
                                            key={i}
                                            className={styles.codeLine}
                                            style={{ width: line.w, background: line.color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.hinge} />

                        <div className={styles.base}>
                            <div className={styles.keyboard}>
                                {Array.from({ length: 48 }).map((_, i) => (
                                    <div key={i} className={styles.key} />
                                ))}
                            </div>
                        </div>

                        <div className={styles.trackpadRow}>
                            <div className={styles.trackpad} />
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
