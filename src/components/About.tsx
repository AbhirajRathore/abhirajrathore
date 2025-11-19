"use client";

import { motion } from "framer-motion";
import styles from "./About.module.css";

export default function About() {
    return (
        <section id="about" className={styles.about}>
            <motion.div
                className={`${styles.container} glass`}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
                <h2 className={styles.title}>About Me</h2>
                <div className={styles.content}>
                    <p>
                        I am a <strong>Software Engineer II</strong> with over 4 years of experience building high-performance, distributed data systems.
                        Currently based in Dubai, I specialize in <strong>Node.js, C#, and modern SQL/NoSQL stacks</strong>.
                    </p>
                    <p>
                        My passion lies in optimizing APIs (achieving 10x+ speed improvements), architecting resilient event-driven services with <strong>Kafka</strong>,
                        and delivering real-time reporting pipelines for high-stakes financial operations.
                    </p>
                    <p>
                        I am comfortable contributing across the stack (React) to ship cohesive products in agile environments.
                    </p>
                </div>
            </motion.div>
        </section>
    );
}
