"use client";

import { motion } from "framer-motion";
import styles from "./Contact.module.css";
import { FiMail, FiLinkedin, FiGithub, FiPhone } from "react-icons/fi";

const contactLinks = [
    {
        label: "Email",
        value: "abhiraj.rathoree@gmail.com",
        href: "mailto:abhiraj.rathoree@gmail.com",
        icon: <FiMail />
    },
    {
        label: "LinkedIn",
        value: "linkedin.com/in/abhirajrathoree",
        href: "https://linkedin.com/in/abhirajrathoree",
        icon: <FiLinkedin />
    },
    {
        label: "GitHub",
        value: "github.com/abhirajrathoree", // Assuming github handle based on pattern, user can update
        href: "https://github.com/abhirajrathoree",
        icon: <FiGithub />
    },
    {
        label: "Phone",
        value: "+971 52 175 0314",
        href: "tel:+971521750314",
        icon: <FiPhone />
    }
];

export default function Contact() {
    return (
        <div className={styles.contact}>
            <motion.div
                className={`${styles.container} glass`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h1 className={styles.title}>Get in Touch</h1>
                <p className={styles.subtitle}>
                    Feel free to reach out for collaborations or just a friendly hello
                </p>

                <div className={styles.links}>
                    {contactLinks.map((link, index) => (
                        <motion.a
                            key={index}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkCard}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                        >
                            <div className={styles.icon}>{link.icon}</div>
                            <div className={styles.linkInfo}>
                                <span className={styles.linkLabel}>{link.label}</span>
                                <span className={styles.linkValue}>{link.value}</span>
                            </div>
                        </motion.a>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
