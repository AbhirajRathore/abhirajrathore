"use client";

import styles from "./Hero.module.css";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={`${styles.backgroundShape} ${styles.shape1}`} />
            <div className={`${styles.backgroundShape} ${styles.shape2}`} />

            <div className={styles.content}>
                <motion.h1
                    className={styles.title}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    Abhiraj Singh Rathore
                </motion.h1>
                <motion.p
                    className={styles.subtitle}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    Software Engineer II | Distributed Systems | Full Stack
                </motion.p>

                <motion.div
                    className={styles.cta}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <Link href="#projects" className={`${styles.button} ${styles.primaryButton}`}>
                        View Projects
                    </Link>
                    <Link href="/contact" className={`${styles.button} ${styles.secondaryButton}`}>
                        Contact Me
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
