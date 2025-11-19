"use client";

import { motion } from "framer-motion";
import styles from "./Skills.module.css";

const skillCategories = [
    {
        title: "Programming & Frameworks",
        skills: ["Node.js", "C#", "JavaScript", "TypeScript", "React.js", "Express.js", "Python", "REST APIs", "WebSockets"]
    },
    {
        title: "Distributed Systems",
        skills: ["Microservices", "Kafka", "Event-Driven Systems", "Scalable Architecture"]
    },
    {
        title: "Data & Storage",
        skills: ["MSSQL", "PL/SQL", "PostgreSQL", "Redis", "Stored Procedures", "Query Optimization"]
    },
    {
        title: "Cloud & DevOps",
        skills: ["AWS", "Azure", "Docker", "NGINX", "GitLab CI/CD", "GitHub Actions", "Linux"]
    },
    {
        title: "Monitoring & Reliability",
        skills: ["Prometheus", "Grafana", "Logging & Alerting", "API Performance"]
    },
    {
        title: "Full-Stack Integration",
        skills: ["MUI", "AG Grid", "Tailwind CSS", "Bootstrap"]
    }
];

export default function Skills() {
    return (
        <section id="skills" className={styles.skills}>
            <div className={styles.container}>
                <motion.h2
                    className={styles.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    Technical Skills
                </motion.h2>

                <div className={styles.categoryGrid}>
                    {skillCategories.map((category, index) => (
                        <motion.div
                            key={index}
                            className={`${styles.categoryCard} glass`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <h3 className={styles.categoryTitle}>{category.title}</h3>
                            <div className={styles.skillList}>
                                {category.skills.map((skill, i) => (
                                    <span key={i} className={styles.skillItem}>{skill}</span>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
