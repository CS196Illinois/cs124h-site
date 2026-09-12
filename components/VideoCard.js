"use client";

import styles from "./ProjectCard.module.css";
import { VideoIcon } from "@phosphor-icons/react";

export default function VideoCard({ project }) {
  return (
    <div className={styles.projectCard}>
      {project.imageUrl && <img
        src={project.imageUrl}
        alt={project.title}
        className={styles.cardImage}
        onError={(e) => {
          e.currentTarget.hidden = true;
        }}
      />}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{project.title}</h3>
        {Array.isArray(project.members) && project.members.length > 0 && (
          <p className={styles.cardMembers}>By: {project.members.join(", ")}</p>
        )}
        <p className={styles.cardDescription}>{project.description}</p>
        <a
          href={project.videoUrl}
          target="_blank" // just opens the link in a new tab
          rel="noopener noreferrer"
          className={styles.githubButton}
        >
          {/* Use inline style for icon size/margin or wrap in a styled span if needed */}
          <VideoIcon
            size={16}
            style={{ marginRight: "8px", transform: "scale(1)" }}
            className={styles.githubIcon}
          />
          Watch Video
        </a>
      </div>
    </div>
  );
};