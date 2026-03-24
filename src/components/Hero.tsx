"use client";

import styles from "./Hero.module.css";
import Link from "next/link";
import Image from "next/image";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    useMotionTemplate,
} from "framer-motion";
import { useEffect, useRef, useCallback } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
    const ref = useRef<HTMLElement>(null);
    const mx = useMotionValue(0.5);
    const my = useMotionValue(0.5);
    const sx = useSpring(mx, { stiffness: 40, damping: 30 });
    const sy = useSpring(my, { stiffness: 40, damping: 30 });
    const xPct = useTransform(sx, (v) => v * 100);
    const yPct = useTransform(sy, (v) => v * 100);
    const spotlightBg = useMotionTemplate`radial-gradient(900px circle at ${xPct}% ${yPct}%, var(--spot), transparent 55%)`;

    const onMove = useCallback(
        (e: MouseEvent) => {
            if (!ref.current) return;
            const r = ref.current.getBoundingClientRect();
            mx.set((e.clientX - r.left) / r.width);
            my.set((e.clientY - r.top) / r.height);
        },
        [mx, my]
    );

    useEffect(() => {
        const el = ref.current;
        el?.addEventListener("mousemove", onMove);
        return () => el?.removeEventListener("mousemove", onMove);
    }, [onMove]);

    const nameLines = ["Abhiraj", "Rathore."];

    return (
        <section ref={ref} className={styles.hero}>
            <motion.div
                className={styles.spotlight}
                style={{ background: spotlightBg }}
            />
            <div className={styles.grain} />
            <div className={styles.amb1} />
            <div className={styles.amb2} />

            <div className={styles.layout}>
                <div className={styles.text}>
                    <motion.div
                        className={styles.tag}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                    >
                        <span className={styles.dot} />
                        Software Engineer II
                    </motion.div>

                    <h1 className={styles.h1}>
                        {nameLines.map((word, i) => (
                            <span key={word} className={styles.clip}>
                                <motion.span
                                    className={styles.clipInner}
                                    initial={{ y: "120%" }}
                                    animate={{ y: "0%" }}
                                    transition={{
                                        duration: 0.85,
                                        delay: 0.12 + i * 0.1,
                                        ease,
                                    }}
                                >
                                    {word}
                                </motion.span>
                            </span>
                        ))}
                    </h1>

                    <motion.div
                        className={styles.rule}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.7, delay: 0.45, ease }}
                    />

                    <motion.p
                        className={styles.blurb}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.55 }}
                    >
                        Building performant distributed systems &amp; elegant
                        full-stack experiences with obsessive attention to
                        craft.
                    </motion.p>

                    <motion.div
                        className={styles.actions}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.65 }}
                    >
                        <Link href="#projects" className={styles.primary}>
                            <span>View Work</span>
                            <svg
                                className={styles.arrow}
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                            >
                                <path
                                    d="M4 9h10M10.5 5L14 9l-3.5 4"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </Link>
                        <Link href="/contact" className={styles.ghost}>
                            Get in Touch
                        </Link>
                    </motion.div>

                    <motion.div
                        className={styles.metrics}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.85 }}
                    >
                        {[
                            { n: "3+", l: "Years" },
                            { n: "20+", l: "Projects" },
                            { n: "5+", l: "Systems" },
                        ].map((m, i) => (
                            <div key={m.l} className={styles.metric}>
                                {i > 0 && (
                                    <span className={styles.metricDiv} />
                                )}
                                <div className={styles.metricInner}>
                                    <span className={styles.metricN}>
                                        {m.n}
                                    </span>
                                    <span className={styles.metricL}>
                                        {m.l}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <motion.div
                    className={styles.avatarCol}
                    initial={{ opacity: 0, scale: 0.94, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1.1, delay: 0.15, ease: "easeOut" }}
                >
                    <div className={styles.glow} />
                    <div className={styles.frame}>
                        <Image
                            src="/nobg.png"
                            alt="Abhiraj Singh Rathore"
                            width={600}
                            height={700}
                            priority
                            className={styles.img}
                        />
                    </div>
                </motion.div>
            </div>

            <motion.div
                className={styles.scroll}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.7 }}
            >
                <span className={styles.scrollTxt}>Scroll</span>
                <div className={styles.scrollTrack}>
                    <div className={styles.scrollThumb} />
                </div>
            </motion.div>
        </section>
    );
}
