"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiMoon, FiSun } from "react-icons/fi";
import styles from "./Navbar.module.css";

function isTypingTarget(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    if (el.isContentEditable) return true;
    if (el.closest("[contenteditable=true]")) return true;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export default function Navbar() {
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Job Tracker is hidden from the nav; open via /jobs or Alt+Shift+J (ignored while typing in fields).
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (isTypingTarget(e.target)) return;
            if (
                e.altKey &&
                e.shiftKey &&
                !e.ctrlKey &&
                !e.metaKey &&
                e.code === "KeyJ"
            ) {
                e.preventDefault();
                router.push("/jobs");
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [router]);

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
