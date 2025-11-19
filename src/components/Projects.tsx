"use client";

import { motion } from "framer-motion";
import styles from "./Projects.module.css";
import { FiExternalLink } from "react-icons/fi";

const projects = [
    {
        title: "NFT Marketplace (rd-indev.ridida.in)",
        description: "A next-generation NFT Marketplace delivering a fast, intuitive, and reliable NFT listing, buying, and selling experience.",
        tech: ["React.js", "Node.js", "MongoDB"],
        link: "#"
    },
    {
        title: "Blocktickets.io",
        description: "An NFT-based ticketing platform enabling seamless purchasing and verification of event tickets as NFTs.",
        tech: ["React.js", "Node.js", "MongoDB"],
        link: "https://blocktickets.io"
    },
    {
        title: "Syndication Portal",
        description: "Highly scalable Syndication Portal with robust Multi-Tenant support using Microservices Architecture.",
        tech: ["Node.js", "C# (.NET)", "MongoDB", "React.js"],
        link: "#"
    }
];

export default function Projects() {
    return (
        <section id="projects" className={styles.projects}>
            <div className={styles.container}>
                <motion.h2
                    className={styles.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                >
                    Featured Projects
                </motion.h2>

                <div className={styles.grid}>
                    {projects.map((project, index) => (
                        <motion.div
                            key={index}
                            className={`${styles.card} glass`}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <h3 className={styles.projectTitle}>{project.title}</h3>
                            <p className={styles.description}>{project.description}</p>
                            <div className={styles.techStack}>
                                {project.tech.map((tech, i) => (
                                    <span key={i} className={styles.tag}>{tech}</span>
                                ))}
                            </div>
                            <div className={styles.links}>
                                {project.link !== "#" && (
                                    <a href={project.link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                        Visit Project <FiExternalLink />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
