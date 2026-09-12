import styles from "./StaffCard.module.css";

export default function StaffCard({ member, onClick }) {
  return (
    <button
      className={styles.staffCardBox}
      onClick={() => onClick?.(member)}
      key={member.id ?? member.name}
      type="button"
    >
      <div className={styles.staffImageBox}>
        {member.image ? <img src={member.image} alt="" /> : <span className={styles.imageFallback}>{member.name?.charAt(0) || "?"}</span>}
      </div>
      <p className={styles.staffCardText}>{member.name || "Course staff"}</p>
      {member.role && <p className={styles.staffCardRole}>{member.role}</p>}
      <span className={styles.viewProfile}>View profile <span aria-hidden="true">→</span></span>
    </button>
  );
}
