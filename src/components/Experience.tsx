"use client";

import { motion } from "framer-motion";
import styles from "./Experience.module.css";

const experiences = [
    {
        role: "SDE-II",
        company: "KGK Diamonds DMCC, Dubai UAE",
        duration: "Dec 2023 - Present",
        points: [
            "Boosted CRM & ERP API performance by 92% (51 s → 5 s), improving customer experience and lowering compute costs.",
            "Architected and deployed Kafka-driven inventory synchronization handling 10,000 Average Events per hour across 5 global hubs.",
            "Led and Built role-based Tender/Bidding platform managing $50M+ inventory each tender.",
            "Automated investor & receivables reporting pipeline for $300M+ receivables, achieving 100% error reduction.",
            "Implemented Prometheus + Grafana monitoring, cutting incident detection time by 40%.",
            "Delivered sales-incentive & business-KPI analytics, speeding decision-making by 90%."
        ]
    },
    {
        role: "Associate Software Engineer",
        company: "Sigma Infosolutions, Ahmedabad",
        duration: "June 2023 - Dec 2023",
        points: [
            "Designed and implemented a highly scalable Syndication Portal with robust Multi-Tenant support using NodeJs, C# (NET), MongoDB, and ReactJS.",
            "Enhanced features within the Docitt platform (US mortgage industry).",
            "Authored config driven scalable component libraries for React and MUI, increasing frontend development productivity by 2x."
        ]
    },
    {
        role: "Full Stack Developer",
        company: "Blokminers.io",
        duration: "May 2022 - May 2023",
        points: [
            "Built and launched rd-indev.ridida.in — a next-generation NFT Marketplace.",
            "Developed and deployed blocktickets.io — an NFT-based ticketing platform."
        ]
    }
];

export default function Experience() {
    return (
        <section id="experience" className={styles.experience}>
            <div className={styles.container}>
                <motion.h2
                    className={styles.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    Professional Experience
                </motion.h2>

                <div className={styles.timeline}>
                    {experiences.map((exp, index) => (
                        <motion.div
                            key={index}
                            className={`${styles.card} glass`}
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            whileHover={{
                                scale: 1.02,
                                y: -5,
                                rotateX: 2,
                                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 20px rgba(59, 130, 246, 0.2)",
                                zIndex: 10,
                                transition: { duration: 0.2 }
                            }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            viewport={{ once: true }}
                            style={{ perspective: 1000 }}
                        >
                            <h3 className={styles.role}>{exp.role}</h3>
                            <h4 className={styles.company}>{exp.company}</h4>
                            <span className={styles.duration}>{exp.duration}</span>
                            <ul className={styles.points}>
                                {exp.points.map((point, i) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
