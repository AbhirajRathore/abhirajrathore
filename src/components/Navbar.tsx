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

    if (!mounted) return null;

    return (
        <nav className={clsx(styles.navbar, "glass")}>
            <div className={styles.logo}>
                <Link href="/">Abhiraj Singh</Link>
            </div>
            <div className={styles.links}>
                <Link href="#about" className={styles.link}>About</Link>
                <Link href="#experience" className={styles.link}>Experience</Link>
                <Link href="#projects" className={styles.link}>Projects</Link>
                <Link href="#skills" className={styles.link}>Skills</Link>
                <Link href="/contact" className={styles.link}>Contact</Link>
                <button
                    className={styles.themeToggle}
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    aria-label="Toggle Theme"
                >
                    {theme === "dark" ? <FiSun /> : <FiMoon />}
                </button>
            </div>
        </nav>
    );
}
