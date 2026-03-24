"use client";

import styles from "./Hero.module.css";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.bgOrb1} />
            <div className={styles.bgOrb2} />
            <div className={styles.bgOrb3} />
            <div className={styles.gridOverlay} />

            <div className={styles.container}>
                <div className={styles.textColumn}>
                    <motion.div
                        className={styles.badge}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className={styles.badgeDot} />
                        Available for opportunities
                    </motion.div>

                    <motion.h1
                        className={styles.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                    >
                        Hi, I&apos;m{" "}
                        <span className={styles.nameGradient}>Abhiraj</span>
                    </motion.h1>

                    <motion.p
                        className={styles.subtitle}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        Software Engineer II
                    </motion.p>

                    <motion.p
                        className={styles.description}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                    >
                        Building performant distributed systems and elegant
                        full-stack experiences. Passionate about clean
                        architecture and scalable solutions.
                    </motion.p>

                    <motion.div
                        className={styles.cta}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                    >
                        <Link
                            href="#projects"
                            className={`${styles.button} ${styles.primaryButton}`}
                        >
                            View Projects
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                className={styles.btnIcon}
                            >
                                <path
                                    d="M3.33 8h9.34M8.67 4l4 4-4 4"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </Link>
                        <Link
                            href="/contact"
                            className={`${styles.button} ${styles.secondaryButton}`}
                        >
                            Contact Me
                        </Link>
                    </motion.div>

                    <motion.div
                        className={styles.techStack}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.6 }}
                    >
                        <span className={styles.techLabel}>Tech Stack</span>
                        <div className={styles.techTags}>
                            {["Go", "TypeScript", "React", "AWS", "K8s"].map(
                                (tech) => (
                                    <span key={tech} className={styles.techTag}>
                                        {tech}
                                    </span>
                                )
                            )}
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    className={styles.avatarColumn}
                    initial={{ opacity: 0, scale: 0.9, x: 40 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
                >
                    <div className={styles.avatarWrapper}>
                        <div className={styles.avatarGlow} />
                        <div className={styles.avatarRing} />
                        <div className={styles.avatarImageContainer}>
                            <Image
                                src="/nobg.png"
                                alt="Abhiraj Singh Rathore"
                                width={480}
                                height={480}
                                priority
                                className={styles.avatarImage}
                            />
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                className={styles.scrollIndicator}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
            >
                <div className={styles.scrollLine} />
            </motion.div>
        </section>
    );
}
