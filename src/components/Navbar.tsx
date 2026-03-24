"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FiMoon, FiSun } from "react-icons/fi";
import styles from "./Navbar.module.css";
import clsx from "clsx";

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by only rendering the theme dependent parts after mount
    // But we still want to render the structure

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContent}>
                <Link href="/" className={styles.logo}>Abhiraj Singh</Link>

                <div className={styles.links}>
                    <Link href="#about" className={styles.link}>About</Link>
                    <Link href="#experience" className={styles.link}>Experience</Link>
                    <Link href="#projects" className={styles.link}>Projects</Link>
                    <Link href="#skills" className={styles.link}>Skills</Link>
                    <Link href="/contact" className={styles.link}>Contact</Link>
                    <Link href="/jobs" className={styles.link} style={{ color: "var(--primary)", fontWeight: 600 }}>Job Tracker</Link>
                </div>

                <button
                    className={styles.themeToggle}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle Theme"
                >
                    {mounted ? (theme === "dark" ? <FiSun /> : <FiMoon />) : <FiMoon />}
                </button>
            </div>
        </nav>
    );
}
