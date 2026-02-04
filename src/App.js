import React, { useState, useEffect, useRef } from 'react';

export default function ClassroomMonitoringSystem() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(null);
  const [classrooms, setClassrooms] = useState([
    { id: 1, name: 'כיתה י-1', grade: 'כיתה י', subject: 'מתמטיקה', teacher: 'מר כהן', students: 32, status: 'green', talkingCount: 0, alerts: 0, lastAlert: null, discipline: 0.95 },
    { id: 2, name: 'כיתה י-2', grade: 'כיתה י', subject: 'פיזיקה', teacher: 'גב׳ לוי', students: 28, status: 'green', talkingCount: 0, alerts: 0, lastAlert: null, discipline: 0.9 },
    { id: 3, name: 'כיתה יא-1', grade: 'כיתה יא', subject: 'היסטוריה', teacher: 'מר שפירא', students: 30, status: 'green', talkingCount: 0, alerts: 0, lastAlert: null, discipline: 0.7 },
    { id: 4, name: 'כיתה יא-2', grade: 'כיתה יא', subject: 'אנגלית', teacher: 'גב׳ דוד', students: 26, status: 'green', talkingCount: 0, alerts: 0, lastAlert: null, discipline: 0.85 },
    { id: 5, name: 'כיתה יב-1', grade: 'כיתה יב', subject: 'כימיה', teacher: 'ד"ר מזרחי', students: 24, status: 'green', talkingCount: 0, alerts: 0, lastAlert: null, discipline: 0.5 },
    { id: 6, name: 'כיתה יב-2', grade: 'כיתה יב', subject: 'ביולוגיה', teacher: 'גב׳ פרץ', students: 29, status: 'green', talkingCount: 0, alerts: 0, lastAlert: null, discipline: 0.92 },
    { id: 7, name: 'כיתה יב-3', grade: 'כיתה יב', subject: 'ספרות', teacher: 'מר אזולאי', students: 31, status: 'green', talkingCount: 0, alerts: 0, lastAlert: null, discipline: 0.6 },
    { id: 8, name: 'כיתה יא-3', grade: 'כיתה יא', subject: 'גיאוגרפיה', teacher: 'גב׳ כץ', students: 27, status: 'green', talkingCount: 0, alerts: 0, lastAlert: null, discipline: 0.98 },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track which classrooms are currently "active"
  const activeClassRef = useRef({ ids: [], since: 0, levels: {} });

  const pickRandomClassroom = (prev, excludeIds) => {
    const available = prev.filter(c => !excludeIds.includes(c.id));
    if (available.length === 0) return prev[0].id;
    const weights = available.map(c => (1 - c.discipline) + 0.1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < available.length; i++) {
      r -= weights[i];
      if (r <= 0) return available[i].id;
    }
    return available[0].id;
  };

  useEffect(() => {
    const updateInterval = setInterval(() => {
      setClassrooms(prev => {
        const now = Date.now();
        const ref = activeClassRef.current;

        // Rotate every 10-18 seconds
        const elapsed = now - ref.since;
        const shouldRotate = ref.ids.length === 0 || elapsed > (10000 + Math.random() * 8000);

        if (shouldRotate) {
          // 75% one classroom, 25% two classrooms
          const twoClassrooms = Math.random() < 0.25;
          
          const id1 = pickRandomClassroom(prev, []);
          // 80% yellow, 20% red for each
          const level1 = Math.random() < 0.8 ? 1 : 2;
          
          const newLevels = { [id1]: level1 };
          const newIds = [id1];

          if (twoClassrooms) {
            const id2 = pickRandomClassroom(prev, [id1]);
            const level2 = Math.random() < 0.8 ? 1 : 2;
            newLevels[id2] = level2;
            newIds.push(id2);
          }

          ref.ids = newIds;
          ref.since = now;
          ref.levels = newLevels;
        }

        return prev.map(classroom => {
          let newTalking = 0;
          let newAlerts = classroom.alerts;
          let newStatus = 'green';
          let newLastAlert = classroom.lastAlert;

          if (ref.ids.includes(classroom.id)) {
            newTalking = ref.levels[classroom.id] || 1;
            newAlerts = classroom.alerts + (classroom.talkingCount === 0 ? 1 : 0);
            newLastAlert = 'עכשיו';
          }

          if (newTalking === 0) newStatus = 'green';
          else if (newTalking === 1) newStatus = 'yellow';
          else newStatus = 'red';

          return { ...classroom, talkingCount: newTalking, alerts: newAlerts, status: newStatus, lastAlert: newLastAlert };
        });
      });
    }, 2000);

    return () => clearInterval(updateInterval);
  }, []);

  const formatTime = d => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = d => d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusColor = (status) => {
    switch(status) {
      case 'green': return { bg: '#10b981', glow: 'rgba(16,185,129,0.4)', text: 'שקט' };
      case 'yellow': return { bg: '#f59e0b', glow: 'rgba(245,158,11,0.4)', text: 'מעט דיבורים' };
      case 'red': return { bg: '#ef4444', glow: 'rgba(239,68,68,0.4)', text: 'דיבורים פעילים' };
      default: return { bg: '#64748b', glow: 'rgba(100,116,139,0.4)', text: 'לא ידוע' };
    }
  };

  const totalStudents = classrooms.reduce((sum, c) => sum + c.students, 0);
  const totalAlerts = classrooms.reduce((sum, c) => sum + c.alerts, 0);
  const activeClasses = classrooms.filter(c => c.status !== 'green').length;

  if (selectedClass) {
    return <ClassroomDetail classroom={selectedClass} onBack={() => setSelectedClass(null)} />;
  }

  return (
    <div style={styles.container} className="main-container">
      {/* Header */}
      <div style={styles.header} className="main-header">
        <div style={styles.headerLeft} className="header-left">
          <div style={styles.logoBox} className="logo-box">🎓</div>
          <div>
            <h1 style={styles.logoTitle} className="logo-title">מוניטור כיתות חכם</h1>
            <p style={styles.logoSub} className="logo-sub">מערכת ניטור כיתות מבוססת בינה מלאכותית</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.clockBox} className="clock-box">
            <div style={styles.clockTime} className="clock-time">{formatTime(currentTime)}</div>
            <div style={styles.clockDate} className="clock-date">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar} className="stats-bar">
        {[
          { icon: '🏫', value: classrooms.length, label: 'סה"כ כיתות', color: '#6366f1' },
          { icon: '👥', value: totalStudents, label: 'סה"כ תלמידים', color: '#3b82f6' },
          { icon: '🚨', value: totalAlerts, label: 'התראות היום', color: '#ef4444' },
          { icon: '⚠️', value: activeClasses, label: 'כיתות עם פעילות', color: '#f59e0b' },
          { icon: '✅', value: classrooms.filter(c => c.status === 'green').length, label: 'כיתות שקטות', color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} style={styles.statCard} className="stat-card">
            <span style={{ fontSize: 24 }} className="stat-icon">{stat.icon}</span>
            <span style={{ ...styles.statValue, color: stat.color }} className="stat-value">{stat.value}</span>
            <span style={styles.statLabel} className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Status Legend */}
      <div style={styles.legendBar} className="legend-bar">
        <span style={styles.legendTitle}>מקרא סטטוס:</span>
        {[
          { color: '#10b981', label: 'שקט - לא זוהו דיבורים' },
          { color: '#f59e0b', label: 'אזהרה - חלק מהתלמידים מדברים' },
          { color: '#ef4444', label: 'התראה - מספר תלמידים מדברים' },
        ].map((item, i) => (
          <div key={i} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Classrooms Grid */}
      <div style={styles.classroomsGrid} className="classrooms-grid">
        {classrooms.map(classroom => {
          const statusInfo = getStatusColor(classroom.status);
          return (
            <div
              key={classroom.id}
              style={{
                ...styles.classCard,
                borderColor: statusInfo.bg,
                boxShadow: `0 4px 20px ${statusInfo.glow}`,
              }}
              className="class-card"
              onClick={() => setSelectedClass(classroom)}
            >
              {/* Top Row: Name + Status */}
              <div style={styles.cardTopRow}>
                <h3 style={styles.className} className="card-class-name">{classroom.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {classroom.status === 'red' && (
                    <span style={styles.alertTag} className="alert-tag">⚠️ נדרשת בדיקה</span>
                  )}
                  <div style={{
                    ...styles.statusDot,
                    background: statusInfo.bg,
                    boxShadow: `0 0 12px ${statusInfo.glow}`,
                  }} className="status-dot-wrap">
                    <span className={classroom.status !== 'green' ? 'pulse' : ''} 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'inherit', display: 'block' }} />
                  </div>
                </div>
              </div>

              {/* Subject Row */}
              <div style={styles.cardInfoRow} className="card-info-row">
                <span style={styles.cardInfoItem}>📚 {classroom.subject}</span>
              </div>

              {/* Status Badge */}
              <div style={styles.cardStatusRow} className="card-status-row">
                <span style={{ 
                  ...styles.statusBadge, 
                  background: `${statusInfo.bg}20`, 
                  color: statusInfo.bg,
                }} className="card-status-badge">
                  {statusInfo.text}
                </span>
                <span style={styles.cardStudents} className="card-students">👥 {classroom.students} תלמידים</span>
              </div>

              {/* Stats Row */}
              <div style={styles.cardStatsRow} className="card-stats-row">
                <div style={styles.cardStat}>
                  <span style={{ ...styles.cardStatNum, color: classroom.talkingCount > 0 ? '#ef4444' : '#10b981' }} className="card-stat-num">
                    {classroom.talkingCount}
                  </span>
                  <span style={styles.cardStatLabel} className="card-stat-label">מדברים</span>
                </div>
                <div style={styles.cardStatDivider} className="card-stat-divider" />
                <div style={styles.cardStat}>
                  <span style={{ ...styles.cardStatNum, color: '#f59e0b' }} className="card-stat-num">{classroom.alerts}</span>
                  <span style={styles.cardStatLabel} className="card-stat-label">התראות</span>
                </div>
                <div style={styles.cardStatDivider} className="card-stat-divider" />
                <div style={styles.cardStat}>
                  <span style={styles.cardStatNum} className="card-stat-num">{classroom.lastAlert || '—'}</span>
                  <span style={styles.cardStatLabel} className="card-stat-label">אחרונה</span>
                </div>
              </div>

              {/* View Button */}
              <button style={styles.viewBtn} className="view-btn">
                <span>צפה בפרטים</span>
                <span>←</span>
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .pulse { animation: pulse 2.5s infinite; }
        
        * { box-sizing: border-box; }
        
        /* ===== MOBILE (< 480px) ===== */
        @media (max-width: 480px) {
          .main-container {
            padding: 8px !important;
          }
          .main-header {
            flex-direction: column !important;
            gap: 8px !important;
            padding-bottom: 10px !important;
            margin-bottom: 10px !important;
          }
          .header-left {
            gap: 10px !important;
          }
          .logo-box {
            width: 36px !important;
            height: 36px !important;
            font-size: 18px !important;
            border-radius: 8px !important;
          }
          .logo-title {
            font-size: 16px !important;
          }
          .logo-sub {
            font-size: 8px !important;
          }
          .clock-box {
            padding: 6px 10px !important;
            width: 100% !important;
            text-align: center !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 12px !important;
          }
          .clock-time {
            font-size: 16px !important;
          }
          .clock-date {
            font-size: 9px !important;
          }
          .stats-bar {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
            margin-bottom: 8px !important;
          }
          .stat-card {
            padding: 8px 4px !important;
            border-radius: 8px !important;
            gap: 2px !important;
          }
          .stat-icon {
            font-size: 14px !important;
          }
          .stat-value {
            font-size: 16px !important;
          }
          .stat-label {
            font-size: 7px !important;
          }
          .legend-bar {
            display: none !important;
          }
          .classrooms-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .class-card {
            padding: 10px !important;
            border-radius: 10px !important;
            gap: 6px !important;
            border-width: 1.5px !important;
          }
          .card-class-name {
            font-size: 13px !important;
          }
          .card-info-row {
            font-size: 10px !important;
          }
          .card-status-row {
            flex-wrap: wrap !important;
            gap: 4px !important;
          }
          .card-status-badge {
            font-size: 9px !important;
            padding: 2px 8px !important;
          }
          .card-students {
            font-size: 9px !important;
          }
          .card-stats-row {
            padding: 6px 0 !important;
          }
          .card-stat-num {
            font-size: 14px !important;
          }
          .card-stat-label {
            font-size: 7px !important;
          }
          .card-stat-divider {
            height: 20px !important;
          }
          .view-btn {
            padding: 8px 10px !important;
            font-size: 10px !important;
            border-radius: 8px !important;
          }
          .alert-tag {
            font-size: 7px !important;
            padding: 2px 4px !important;
          }
          .status-dot-wrap {
            width: 10px !important;
            height: 10px !important;
          }
        }
        
        /* ===== LARGE PHONES (481-600px) ===== */
        @media (min-width: 481px) and (max-width: 600px) {
          .main-container {
            padding: 10px !important;
          }
          .main-header {
            flex-direction: column !important;
            gap: 10px !important;
          }
          .logo-title {
            font-size: 20px !important;
          }
          .stats-bar {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          .stat-card {
            padding: 10px 6px !important;
          }
          .stat-value {
            font-size: 18px !important;
          }
          .stat-label {
            font-size: 8px !important;
          }
          .legend-bar {
            display: none !important;
          }
          .classrooms-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .class-card {
            padding: 12px !important;
            gap: 8px !important;
          }
          .card-class-name {
            font-size: 15px !important;
          }
          .view-btn {
            padding: 9px 12px !important;
            font-size: 11px !important;
          }
        }
        
        /* ===== TABLETS (601-900px) ===== */
        @media (min-width: 601px) and (max-width: 900px) {
          .main-container {
            padding: 16px !important;
          }
          .stats-bar {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
          }
          .stat-card {
            min-width: calc(33% - 10px) !important;
            flex: 1 1 calc(33% - 10px) !important;
          }
          .legend-bar {
            flex-wrap: wrap !important;
            gap: 12px !important;
          }
          .classrooms-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px !important;
          }
        }
        
        /* ===== SMALL DESKTOP (901-1200px) ===== */
        @media (min-width: 901px) and (max-width: 1200px) {
          .classrooms-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        
        /* ===== LARGE DESKTOP (1200+) ===== */
        @media (min-width: 1201px) {
          .classrooms-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }

        /* ===== DETAIL PAGE MOBILE ===== */
        @media (max-width: 768px) {
          .detail-container {
            flex-direction: column !important;
            overflow-x: hidden !important;
          }
          .detail-sidebar {
            width: 100% !important;
            min-width: 0 !important;
            flex-shrink: 0 !important;
            border-left: none !important;
            border-bottom: 1px solid rgba(99,102,241,0.15) !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 14px !important;
          }
          .detail-main {
            padding: 10px !important;
            min-width: 0 !important;
            overflow-x: hidden !important;
          }
          .detail-header {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .detail-page-title {
            font-size: 14px !important;
          }
          .detail-canvas-box {
            padding: 6px !important;
            border-radius: 12px !important;
            overflow: hidden !important;
          }
          .detail-canvas-box canvas {
            max-width: 100% !important;
            height: auto !important;
          }
          .detail-bottom-bar {
            flex-wrap: wrap !important;
            gap: 6px !important;
          }
          .detail-bottom-bar > div {
            min-width: calc(50% - 6px) !important;
            font-size: 9px !important;
            padding: 8px !important;
          }
          .camera-info {
            flex-direction: column !important;
            gap: 4px !important;
            font-size: 9px !important;
          }
        }
      `}</style>
    </div>
  );
}

// Classroom Detail View
function ClassroomDetail({ classroom, onBack }) {
  const [notifications, setNotifications] = useState([
    { id: 1, time: new Date(), type: 'system', icon: '🟢', message: 'ניטור AI הופעל עבור ' + classroom.name },
    { id: 2, time: new Date(), type: 'info', icon: '📹', message: 'מצלמה מחוברת - איכות HD' },
    { id: 3, time: new Date(), type: 'info', icon: '🎤', message: 'כל 6 המיקרופונים מכוילים ופעילים' },
  ]);

  const [currentStatus, setCurrentStatus] = useState('green');
  const [talkingCount, setTalkingCount] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);

  const canvasRef = useRef(null);
  const cameraFeedRef = useRef(null);
  const animationRef = useRef(null);
  const stateRef = useRef({
    tick: 0,
    activeStudents: new Set(),
    lastNoiseTime: 0,
    particles: [],
  });

  const [showCameraFeed, setShowCameraFeed] = useState(false);

  const classroomLayout = {
    width: 900,
    height: 500,
    desks: [],
    teacher: { x: 450, y: 450 },
    camera: { x: 450, y: 30 },
    whiteboard: { x: 175, y: 430, w: 550, h: 50 },
    door: { x: 850, y: 200, w: 40, h: 80 },
    microphones: [
      { id: 1, x: 150, y: 100, label: 'MIC-1' },
      { id: 2, x: 450, y: 100, label: 'MIC-2' },
      { id: 3, x: 750, y: 100, label: 'MIC-3' },
      { id: 4, x: 150, y: 250, label: 'MIC-4' },
      { id: 5, x: 450, y: 250, label: 'MIC-5' },
      { id: 6, x: 750, y: 250, label: 'MIC-6' },
    ],
  };

  // Generate desks
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const x = 100 + col * 130;
      const y = 80 + row * 85;
      classroomLayout.desks.push({
        x, y,
        students: [
          { id: row * 12 + col * 2 + 1, x: x - 18, y: y },
          { id: row * 12 + col * 2 + 2, x: x + 18, y: y },
        ],
      });
    }
  }

  const allStudents = classroomLayout.desks.flatMap(d => d.students);

  const addNotification = (type, icon, message) => {
    setNotifications(prev => [{
      id: Date.now(),
      time: new Date(),
      type, icon, message,
    }, ...prev].slice(0, 50));
  };

  const findNearestMic = (x, y) => {
    let nearest = classroomLayout.microphones[0];
    let minDist = Infinity;
    classroomLayout.microphones.forEach(mic => {
      const dist = Math.hypot(mic.x - x, mic.y - y);
      if (dist < minDist) { minDist = dist; nearest = mic; }
    });
    return nearest;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Init particles
    if (stateRef.current.particles.length === 0) {
      for (let i = 0; i < 40; i++) {
        stateRef.current.particles.push({
          x: Math.random() * classroomLayout.width,
          y: Math.random() * classroomLayout.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
        });
      }
    }

    const animate = (timestamp) => {
      const state = stateRef.current;
      state.tick++;

      // Background
      const bg = ctx.createRadialGradient(classroomLayout.width/2, classroomLayout.height/2, 0, classroomLayout.width/2, classroomLayout.height/2, classroomLayout.width);
      bg.addColorStop(0, '#151c2c');
      bg.addColorStop(1, '#0a0f1a');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, classroomLayout.width, classroomLayout.height);

      // Particles
      state.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = classroomLayout.width;
        if (p.x > classroomLayout.width) p.x = 0;
        if (p.y < 0) p.y = classroomLayout.height;
        if (p.y > classroomLayout.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99,102,241,0.2)';
        ctx.fill();
      });

      // Grid
      ctx.strokeStyle = 'rgba(99,102,241,0.05)';
      for (let x = 0; x < classroomLayout.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, classroomLayout.height); ctx.stroke();
      }
      for (let y = 0; y < classroomLayout.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(classroomLayout.width, y); ctx.stroke();
      }

      // Generate talking students (less frequent)
      if (timestamp - state.lastNoiseTime > 10000) {
        if (Math.random() < 0.15) {
          state.lastNoiseTime = timestamp;
          const student = allStudents[Math.floor(Math.random() * allStudents.length)];
          state.activeStudents.add(student.id);
          
          const mic = findNearestMic(student.x, student.y);
          const confidence = (85 + Math.random() * 14).toFixed(0);
          
          addNotification('alert', '🚨', `התראה: זוהה תלמיד מדבר ליד ${mic.label} - רמת ודאות: ${confidence}%`);
          setTotalAlerts(prev => prev + 1);
          
          setTimeout(() => {
            state.activeStudents.delete(student.id);
          }, 5000);
        }
      }

      // Generate cheating detection alerts (less frequent)
      if (timestamp - (state.lastCheatTime || 0) > 15000) {
        if (Math.random() < 0.1) {
          state.lastCheatTime = timestamp;
          const student = allStudents[Math.floor(Math.random() * allStudents.length)];
          const studentRow = Math.floor((student.id - 1) / 12) + 1;
          const studentSeat = ((student.id - 1) % 12) + 1;
          const confidence = (75 + Math.random() * 20).toFixed(0);
          
          const cheatTypes = [
            { icon: '👀', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) מציץ לשכן - רמת ודאות: ${confidence}%` },
            { icon: '📱', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) זוהה שימוש בטלפון - רמת ודאות: ${confidence}%` },
            { icon: '📝', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) זוהה העברת פתקים - רמת ודאות: ${confidence}%` },
            { icon: '🤚', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) זוהו סימני יד - רמת ודאות: ${confidence}%` },
            { icon: '↔️', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) תנועת ראש חשודה - רמת ודאות: ${confidence}%` },
            { icon: '📄', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) חשד לפתקים מוסתרים - רמת ודאות: ${confidence}%` },
          ];
          
          const cheatType = cheatTypes[Math.floor(Math.random() * cheatTypes.length)];
          addNotification('warning', cheatType.icon, cheatType.message);
          setTotalAlerts(prev => prev + 1);
        }
      }

      // Update talking count and status
      const currentTalking = state.activeStudents.size;
      setTalkingCount(currentTalking);
      if (currentTalking === 0) {
        setCurrentStatus('green');
      } else if (currentTalking === 1) {
        setCurrentStatus('yellow');
      } else {
        setCurrentStatus('red');
      }

      // Door
      ctx.fillStyle = 'rgba(139,92,246,0.15)';
      ctx.fillRect(classroomLayout.door.x, classroomLayout.door.y, classroomLayout.door.w, classroomLayout.door.h);
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 2;
      ctx.strokeRect(classroomLayout.door.x, classroomLayout.door.y, classroomLayout.door.w, classroomLayout.door.h);

      // Whiteboard
      ctx.shadowColor = 'rgba(255,255,255,0.2)';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(classroomLayout.whiteboard.x, classroomLayout.whiteboard.y, classroomLayout.whiteboard.w, classroomLayout.whiteboard.h);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.strokeRect(classroomLayout.whiteboard.x, classroomLayout.whiteboard.y, classroomLayout.whiteboard.w, classroomLayout.whiteboard.h);

      // Desks
      classroomLayout.desks.forEach(desk => {
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(desk.x - 42, desk.y - 12, 84, 30);
        const dg = ctx.createLinearGradient(desk.x - 45, desk.y, desk.x + 45, desk.y);
        dg.addColorStop(0, '#3d4a5c');
        dg.addColorStop(1, '#1f2937');
        ctx.fillStyle = dg;
        ctx.fillRect(desk.x - 45, desk.y - 15, 90, 30);
        ctx.strokeStyle = 'rgba(100,116,139,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(desk.x - 45, desk.y - 15, 90, 30);
      });

      // Students
      allStudents.forEach(student => {
        const isActive = state.activeStudents.has(student.id);
        
        if (isActive) {
          // Alert pulse
          const pulse = 20 + Math.sin(state.tick * 0.15) * 5;
          ctx.beginPath();
          ctx.arc(student.x, student.y, pulse, 0, Math.PI * 2);
          const pg = ctx.createRadialGradient(student.x, student.y, 0, student.x, student.y, pulse);
          pg.addColorStop(0, 'rgba(239,68,68,0.5)');
          pg.addColorStop(1, 'rgba(239,68,68,0)');
          ctx.fillStyle = pg;
          ctx.fill();

          // Alert icon
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 12px system-ui';
          ctx.fillText('⚠️', student.x, student.y - 20);
        }

        ctx.shadowColor = isActive ? '#ef4444' : '#3b82f6';
        ctx.shadowBlur = isActive ? 20 : 10;
        ctx.beginPath();
        ctx.arc(student.x, student.y, 9, 0, Math.PI * 2);
        const sg = ctx.createRadialGradient(student.x - 2, student.y - 2, 0, student.x, student.y, 9);
        if (isActive) {
          sg.addColorStop(0, '#f87171');
          sg.addColorStop(1, '#dc2626');
        } else {
          sg.addColorStop(0, '#60a5fa');
          sg.addColorStop(1, '#1d4ed8');
        }
        ctx.fillStyle = sg;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Teacher
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(classroomLayout.teacher.x, classroomLayout.teacher.y, 14, 0, Math.PI * 2);
      const tg = ctx.createRadialGradient(classroomLayout.teacher.x - 4, classroomLayout.teacher.y - 4, 0, classroomLayout.teacher.x, classroomLayout.teacher.y, 14);
      tg.addColorStop(0, '#c084fc');
      tg.addColorStop(1, '#7c3aed');
      ctx.fillStyle = tg;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px system-ui';
      ctx.fillText('T', classroomLayout.teacher.x, classroomLayout.teacher.y + 4);

      // Camera
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(classroomLayout.camera.x - 20, classroomLayout.camera.y - 10);
      ctx.lineTo(classroomLayout.camera.x + 20, classroomLayout.camera.y - 10);
      ctx.lineTo(classroomLayout.camera.x + 25, classroomLayout.camera.y);
      ctx.lineTo(classroomLayout.camera.x + 20, classroomLayout.camera.y + 10);
      ctx.lineTo(classroomLayout.camera.x - 20, classroomLayout.camera.y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Camera lens
      ctx.beginPath();
      ctx.arc(classroomLayout.camera.x + 10, classroomLayout.camera.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#064e3b';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(classroomLayout.camera.x + 10, classroomLayout.camera.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.fill();

      // Camera FOV lines
      ctx.strokeStyle = 'rgba(16,185,129,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(classroomLayout.camera.x, classroomLayout.camera.y + 15);
      ctx.lineTo(50, classroomLayout.height - 50);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(classroomLayout.camera.x, classroomLayout.camera.y + 15);
      ctx.lineTo(classroomLayout.width - 50, classroomLayout.height - 50);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px system-ui';
      ctx.fillText('📹 CAMERA', classroomLayout.camera.x, classroomLayout.camera.y + 28);

      // Microphones - Draw as mic shape
      classroomLayout.microphones.forEach(mic => {
        const detecting = state.activeStudents.size > 0 && Math.hypot(
          mic.x - [...state.activeStudents].reduce((sum, id) => {
            const s = allStudents.find(st => st.id === id);
            return s ? sum + s.x : sum;
          }, 0) / state.activeStudents.size,
          mic.y - [...state.activeStudents].reduce((sum, id) => {
            const s = allStudents.find(st => st.id === id);
            return s ? sum + s.y : sum;
          }, 0) / state.activeStudents.size
        ) < 200;

        if (detecting) {
          const mp = 20 + Math.sin(state.tick * 0.1) * 3;
          ctx.beginPath();
          ctx.arc(mic.x, mic.y, mp, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(99,102,241,0.15)';
          ctx.fill();
        }

        // Mic head (rounded top)
        ctx.shadowColor = detecting ? '#10b981' : '#6366f1';
        ctx.shadowBlur = detecting ? 15 : 8;
        ctx.fillStyle = detecting ? '#10b981' : '#6366f1';
        ctx.beginPath();
        ctx.arc(mic.x, mic.y - 6, 8, Math.PI, 0);
        ctx.lineTo(mic.x + 8, mic.y + 2);
        ctx.arc(mic.x, mic.y + 2, 8, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Mic grille lines
        ctx.strokeStyle = detecting ? '#064e3b' : '#312e81';
        ctx.lineWidth = 1;
        for (let i = -4; i <= 4; i += 2) {
          ctx.beginPath();
          ctx.moveTo(mic.x - 6, mic.y + i - 2);
          ctx.lineTo(mic.x + 6, mic.y + i - 2);
          ctx.stroke();
        }

        // Mic stand
        ctx.fillStyle = detecting ? '#059669' : '#4f46e5';
        ctx.fillRect(mic.x - 2, mic.y + 10, 4, 8);

        // Mic base
        ctx.beginPath();
        ctx.ellipse(mic.x, mic.y + 20, 8, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = detecting ? '#047857' : '#4338ca';
        ctx.fill();

        // Label
        ctx.fillStyle = '#64748b';
        ctx.font = '8px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(mic.label, mic.x, mic.y + 32);
      });

      // Labels
      ctx.fillStyle = '#475569';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'left';
      ctx.fillText('יציאה', classroomLayout.door.x - 5, classroomLayout.door.y - 8);

      // Camera label
      ctx.fillStyle = '#64748b';
      ctx.font = '9px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('📹 מצלמה', classroomLayout.camera.x, classroomLayout.camera.y + 28);

      // Whiteboard label
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('לוח', classroomLayout.whiteboard.x + classroomLayout.whiteboard.w/2, classroomLayout.whiteboard.y + 32);

      animationRef.current = requestAnimationFrame(animate);
    };

    // Low-resolution camera feed simulation - 3D Corner view perspective
    const drawCameraFeed = () => {
      const camCanvas = cameraFeedRef.current;
      if (!camCanvas) return;
      const camCtx = camCanvas.getContext('2d');
      const state = stateRef.current;
      
      // Low resolution for privacy
      const lowResWidth = 192;
      const lowResHeight = 144;
      
      // Create off-screen canvas for low-res rendering
      const offscreen = document.createElement('canvas');
      offscreen.width = lowResWidth;
      offscreen.height = lowResHeight;
      const ctx = offscreen.getContext('2d');
      
      // === 3D CORNER VIEW OF CLASSROOM ===
      
      // Sky/ceiling gradient
      const ceilingGrad = ctx.createLinearGradient(0, 0, 0, lowResHeight * 0.3);
      ceilingGrad.addColorStop(0, '#d4d4d4');
      ceilingGrad.addColorStop(1, '#e8e4dc');
      ctx.fillStyle = ceilingGrad;
      ctx.fillRect(0, 0, lowResWidth, lowResHeight * 0.35);
      
      // Back wall (facing camera from corner)
      ctx.fillStyle = '#d9d4c8';
      ctx.beginPath();
      ctx.moveTo(0, lowResHeight * 0.1);
      ctx.lineTo(lowResWidth * 0.7, lowResHeight * 0.2);
      ctx.lineTo(lowResWidth * 0.7, lowResHeight * 0.51);
      ctx.lineTo(0, lowResHeight * 0.48);
      ctx.closePath();
      ctx.fill();
      
      // Right wall (side wall in perspective)
      ctx.fillStyle = '#c9c4b8';
      ctx.beginPath();
      ctx.moveTo(lowResWidth * 0.7, lowResHeight * 0.2);
      ctx.lineTo(lowResWidth, lowResHeight * 0.05);
      ctx.lineTo(lowResWidth, lowResHeight * 0.53);
      ctx.lineTo(lowResWidth * 0.7, lowResHeight * 0.51);
      ctx.closePath();
      ctx.fill();
      
      // Whiteboard on back wall
      ctx.fillStyle = '#f5f5f5';
      ctx.beginPath();
      ctx.moveTo(lowResWidth * 0.08, lowResHeight * 0.18);
      ctx.lineTo(lowResWidth * 0.5, lowResHeight * 0.24);
      ctx.lineTo(lowResWidth * 0.5, lowResHeight * 0.40);
      ctx.lineTo(lowResWidth * 0.08, lowResHeight * 0.33);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Windows on right wall
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        const wy = lowResHeight * 0.18 + i * lowResHeight * 0.14;
        ctx.moveTo(lowResWidth * 0.75, wy);
        ctx.lineTo(lowResWidth * 0.92, wy - 5);
        ctx.lineTo(lowResWidth * 0.92, wy + 14);
        ctx.lineTo(lowResWidth * 0.75, wy + 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      
      // Floor with perspective - sloping down from left to right (raised right corner)
      const floorGrad = ctx.createLinearGradient(0, lowResHeight * 0.5, 0, lowResHeight);
      floorGrad.addColorStop(0, '#a89880');
      floorGrad.addColorStop(1, '#8b8070');
      ctx.fillStyle = floorGrad;
      ctx.beginPath();
      ctx.moveTo(0, lowResHeight * 0.48);
      ctx.lineTo(lowResWidth * 0.7, lowResHeight * 0.51);
      ctx.lineTo(lowResWidth, lowResHeight * 0.53);
      ctx.lineTo(lowResWidth, lowResHeight);
      ctx.lineTo(0, lowResHeight);
      ctx.closePath();
      ctx.fill();
      
      // Floor tile lines (perspective) - matching the slope
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(0, lowResHeight * 0.48 + i * 8);
        ctx.lineTo(lowResWidth, lowResHeight * 0.53 + i * 7);
        ctx.stroke();
      }
      
      // === DRAW DESKS AND STUDENTS (3D Corner Perspective - Proper Rows) ===
      const rows = 4;
      const cols = 6;
      
      // Draw from back to front for proper layering
      for (let row = 0; row < rows; row++) {
        // Calculate row position in 3D perspective
        const rowY = lowResHeight * 0.48 + row * 18;
        const rowScale = 0.45 + row * 0.12;
        const rowStartX = lowResWidth * 0.08 + row * 6;
        const rowWidth = lowResWidth * 0.7;
        
        for (let col = 0; col < cols; col++) {
          // Calculate desk position
          const deskX = rowStartX + col * (rowWidth / cols);
          const deskY = rowY;
          const deskW = 18 * rowScale;
          const deskH = 8 * rowScale;
          
          // Desk shadow
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.beginPath();
          ctx.moveTo(deskX + 2, deskY + 2);
          ctx.lineTo(deskX + deskW + 2, deskY - 3);
          ctx.lineTo(deskX + deskW + 2, deskY + deskH - 3);
          ctx.lineTo(deskX + 2, deskY + deskH + 2);
          ctx.closePath();
          ctx.fill();
          
          // Desk top (3D parallelogram)
          ctx.fillStyle = '#6b5344';
          ctx.beginPath();
          ctx.moveTo(deskX, deskY);
          ctx.lineTo(deskX + deskW, deskY - 4 * rowScale);
          ctx.lineTo(deskX + deskW, deskY + deskH - 4 * rowScale);
          ctx.lineTo(deskX, deskY + deskH);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#4a3728';
          ctx.lineWidth = 0.5;
          ctx.stroke();
          
          // Desk front
          ctx.fillStyle = '#5c4033';
          ctx.beginPath();
          ctx.moveTo(deskX, deskY + deskH);
          ctx.lineTo(deskX + deskW, deskY + deskH - 4 * rowScale);
          ctx.lineTo(deskX + deskW, deskY + deskH - 4 * rowScale + 3 * rowScale);
          ctx.lineTo(deskX, deskY + deskH + 3 * rowScale);
          ctx.closePath();
          ctx.fill();
          
          // Two students per desk
          const studentId1 = row * 12 + col * 2 + 1;
          const studentId2 = row * 12 + col * 2 + 2;
          const isActive1 = state.activeStudents.has(studentId1);
          const isActive2 = state.activeStudents.has(studentId2);
          
          const studentScale = rowScale * 0.8;
          
          // Student 1 (left side of desk)
          const s1x = deskX + deskW * 0.28;
          const s1y = deskY - 1 * rowScale;
          
          // Alert glow if talking
          if (isActive1) {
            ctx.fillStyle = 'rgba(255,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(s1x, s1y - 6 * studentScale, 10 * studentScale, 0, Math.PI * 2);
            ctx.fill();
            
            const pulse = 8 + Math.sin(state.tick * 0.12) * 2;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(s1x, s1y - 6 * studentScale, pulse * studentScale, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          // Body (torso)
          ctx.fillStyle = isActive1 ? '#ff6b6b' : ['#3498db', '#27ae60', '#9b59b6', '#e67e22', '#16a085', '#e74c3c'][studentId1 % 6];
          ctx.beginPath();
          ctx.ellipse(s1x, s1y - 1 * studentScale, 4 * studentScale, 5 * studentScale, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Head
          ctx.fillStyle = '#deb887';
          ctx.beginPath();
          ctx.arc(s1x, s1y - 8 * studentScale, 3.5 * studentScale, 0, Math.PI * 2);
          ctx.fill();
          
          // Hair
          ctx.fillStyle = ['#1a1a1a', '#2c1810', '#4a3728', '#8b4513'][studentId1 % 4];
          ctx.beginPath();
          ctx.arc(s1x, s1y - 9.5 * studentScale, 3 * studentScale, Math.PI, Math.PI * 2);
          ctx.fill();
          
          // Speech indicator
          if (isActive1) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(s1x + 5 * studentScale, s1y - 11 * studentScale, 2.5 * studentScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${4 * studentScale}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('!', s1x + 5 * studentScale, s1y - 9.8 * studentScale);
          }
          
          // Student 2 (right side of desk)
          const s2x = deskX + deskW * 0.72;
          const s2y = deskY - 3 * rowScale;
          
          if (isActive2) {
            ctx.fillStyle = 'rgba(255,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(s2x, s2y - 6 * studentScale, 10 * studentScale, 0, Math.PI * 2);
            ctx.fill();
            
            const pulse = 8 + Math.sin(state.tick * 0.12) * 2;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(s2x, s2y - 6 * studentScale, pulse * studentScale, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          ctx.fillStyle = isActive2 ? '#ff6b6b' : ['#3498db', '#27ae60', '#9b59b6', '#e67e22', '#16a085', '#e74c3c'][studentId2 % 6];
          ctx.beginPath();
          ctx.ellipse(s2x, s2y - 1 * studentScale, 4 * studentScale, 5 * studentScale, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#deb887';
          ctx.beginPath();
          ctx.arc(s2x, s2y - 8 * studentScale, 3.5 * studentScale, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = ['#1a1a1a', '#2c1810', '#4a3728', '#8b4513'][studentId2 % 4];
          ctx.beginPath();
          ctx.arc(s2x, s2y - 9.5 * studentScale, 3 * studentScale, Math.PI, Math.PI * 2);
          ctx.fill();
          
          if (isActive2) {
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(s2x + 5 * studentScale, s2y - 11 * studentScale, 2.5 * studentScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${4 * studentScale}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('!', s2x + 5 * studentScale, s2y - 9.8 * studentScale);
          }
        }
      }
      
      // Add noise/grain for security camera look
      const imageData = ctx.getImageData(0, 0, lowResWidth, lowResHeight);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 18;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);
      
      // Scale up to display size with pixelation
      camCtx.imageSmoothingEnabled = false;
      camCtx.drawImage(offscreen, 0, 0, lowResWidth, lowResHeight, 0, 0, camCanvas.width, camCanvas.height);
      
      // Scanlines
      camCtx.fillStyle = 'rgba(0,0,0,0.05)';
      for (let y = 0; y < camCanvas.height; y += 3) {
        camCtx.fillRect(0, y, camCanvas.width, 1);
      }
      
      // Vignette
      const vignette = camCtx.createRadialGradient(
        camCanvas.width * 0.3, camCanvas.height * 0.4, camCanvas.height * 0.3,
        camCanvas.width * 0.5, camCanvas.height * 0.5, camCanvas.height
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
      camCtx.fillStyle = vignette;
      camCtx.fillRect(0, 0, camCanvas.width, camCanvas.height);
      
      // Timestamp
      camCtx.fillStyle = 'rgba(0,0,0,0.7)';
      camCtx.fillRect(8, 8, 160, 28);
      camCtx.fillStyle = '#00ff00';
      camCtx.font = 'bold 14px monospace';
      camCtx.textAlign = 'left';
      const now = new Date();
      camCtx.fillText(`CAM-01  ${now.toLocaleDateString('he-IL')}`, 14, 26);
      camCtx.fillText(now.toLocaleTimeString('he-IL'), 14, 42);
      
      // REC
      if (Math.floor(state.tick / 25) % 2 === 0) {
        camCtx.fillStyle = '#ff0000';
        camCtx.beginPath();
        camCtx.arc(camCanvas.width - 22, 20, 7, 0, Math.PI * 2);
        camCtx.fill();
      }
      camCtx.fillStyle = '#fff';
      camCtx.font = 'bold 11px sans-serif';
      camCtx.textAlign = 'right';
      camCtx.fillText('REC', camCanvas.width - 34, 16);
      
      // Class name
      camCtx.fillStyle = 'rgba(0,0,0,0.7)';
      camCtx.fillRect(camCanvas.width - 100, camCanvas.height - 30, 92, 22);
      camCtx.fillStyle = '#fff';
      camCtx.font = 'bold 11px sans-serif';
      camCtx.textAlign = 'right';
      camCtx.textBaseline = 'middle';
      camCtx.fillText(classroom.name, camCanvas.width - 12, camCanvas.height - 19);
      
      // Privacy
      camCtx.fillStyle = 'rgba(0,0,0,0.7)';
      camCtx.fillRect(8, camCanvas.height - 30, 175, 22);
      camCtx.fillStyle = '#ffff00';
      camCtx.font = '10px sans-serif';
      camCtx.textAlign = 'left';
      camCtx.fillText('🔒 רזולוציה נמוכה - תואם פרטיות', 12, camCanvas.height - 19);
    };

    // Combined animation loop
    const mainLoop = (timestamp) => {
      animate(timestamp);
      if (showCameraFeed) {
        drawCameraFeed();
      }
    };

    animationRef.current = requestAnimationFrame(mainLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [allStudents, showCameraFeed]);

  const getNotifStyle = type => ({
    alert: { bg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))', border: '#ef4444' },
    warning: { bg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))', border: '#fbbf24' },
    success: { bg: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '#10b981' },
    system: { bg: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))', border: '#6366f1' },
    info: { bg: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(56,189,248,0.05))', border: '#38bdf8' },
  }[type] || { bg: 'rgba(100,116,139,0.1)', border: '#64748b' });

  const formatTime = d => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={detailStyles.container} className="detail-container">
      {/* Sidebar */}
      <div style={detailStyles.sidebar} className="detail-sidebar">
        <button onClick={onBack} style={detailStyles.backBtn}>
          <span>→</span>
          <span>חזרה לדשבורד</span>
        </button>

        <div style={detailStyles.classInfo}>
          <h2 style={detailStyles.classTitle}>{classroom.name}</h2>
          <div style={detailStyles.classMeta}>
            <span>📚 {classroom.subject}</span>
            <span>👨‍🏫 {classroom.teacher}</span>
            <span>🎓 {classroom.grade}</span>
            <span>👥 {classroom.students} תלמידים</span>
          </div>
        </div>

        <div style={detailStyles.statusCard}>
          <div style={detailStyles.statusHeader}>סטטוס נוכחי</div>
          <div style={{
            ...detailStyles.statusValue,
            color: currentStatus === 'green' ? '#10b981' : currentStatus === 'yellow' ? '#f59e0b' : '#ef4444'
          }}>
            {currentStatus === 'green' ? '✅ שקט' : currentStatus === 'yellow' ? '⚠️ מעט דיבורים' : '🚨 דיבורים פעילים'}
          </div>
        </div>

        <div style={detailStyles.statsGrid}>
          <div style={detailStyles.statBox}>
            <span style={{ fontSize: 24 }}>🗣️</span>
            <span style={{ ...detailStyles.statValue, color: talkingCount > 0 ? '#ef4444' : '#10b981' }}>{talkingCount}</span>
            <span style={detailStyles.statLabel}>מדברים כרגע</span>
          </div>
          <div style={detailStyles.statBox}>
            <span style={{ fontSize: 24 }}>🚨</span>
            <span style={{ ...detailStyles.statValue, color: '#f59e0b' }}>{totalAlerts}</span>
            <span style={detailStyles.statLabel}>סה"כ התראות</span>
          </div>
        </div>

        {/* Big Camera Button */}
        <button 
          onClick={() => setShowCameraFeed(!showCameraFeed)}
          style={{
            width: '100%',
            padding: '16px 20px',
            background: showCameraFeed 
              ? 'linear-gradient(135deg, #ef4444, #dc2626)' 
              : 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: 14,
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: showCameraFeed 
              ? '0 4px 20px rgba(239,68,68,0.4)' 
              : '0 4px 20px rgba(16,185,129,0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          <span style={{ fontSize: 24 }}>📹</span>
          {showCameraFeed ? 'סגור מצלמה' : 'פתח מצלמה'}
        </button>

        <div style={detailStyles.card}>
          <div style={detailStyles.cardTitle}>📜 יומן התראות</div>
          <div style={detailStyles.notifList}>
            {notifications.slice(0, 15).map(n => {
              const ns = getNotifStyle(n.type);
              return (
                <div key={n.id} style={{ ...detailStyles.notifItem, background: ns.bg, borderLeftColor: ns.border }}>
                  <div style={detailStyles.notifHeader}>
                    <span>{n.icon}</span>
                    <span style={detailStyles.notifTime}>{formatTime(n.time)}</span>
                  </div>
                  <div style={{ ...detailStyles.notifMsg, color: ns.border }}>{n.message}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={detailStyles.legend}>
          <div style={detailStyles.legendTitle}>מקרא</div>
          {[
            { color: '#3b82f6', label: 'תלמיד (שקט)' },
            { color: '#ef4444', label: 'תלמיד (מדבר)' },
            { color: '#a855f7', label: 'מורה' },
            { color: '#10b981', label: 'מצלמה' },
            { color: '#6366f1', label: 'מיקרופון' },
          ].map((item, i) => (
            <div key={i} style={detailStyles.legendItem}>
              <span style={{ ...detailStyles.legendDot, background: item.color }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main View */}
      <div style={detailStyles.main} className="detail-main">
        <div style={detailStyles.header} className="detail-header">
          <h1 style={detailStyles.pageTitle} className="detail-page-title">📹 צפייה חיה בכיתה - {classroom.name}</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={detailStyles.liveBadge}>
              <span style={detailStyles.liveDot} />
              שידור חי
            </div>
          </div>
        </div>

        {/* Camera Feed Modal/Overlay */}
        {showCameraFeed && (
          <div style={detailStyles.cameraFeedContainer}>
            <div style={detailStyles.cameraFeedHeader}>
              <span>📹 שידור מצלמה - רזולוציה נמוכה (תואם חוק)</span>
              <button 
                onClick={() => setShowCameraFeed(false)}
                style={detailStyles.closeCameraBtn}
              >✕</button>
            </div>
            <canvas 
              ref={cameraFeedRef} 
              width={480} 
              height={270} 
              style={detailStyles.cameraCanvas}
            />
            <div style={detailStyles.cameraInfo} className="camera-info">
              <span>🔒 הקלטה ברזולוציה נמוכה לשמירה על פרטיות</span>
              <span>📊 160x90 פיקסלים</span>
              <span>🛡️ תואם GDPR ותקנות הפרטיות</span>
            </div>
          </div>
        )}

        <div style={detailStyles.canvasBox} className="detail-canvas-box">
          <canvas ref={canvasRef} width={classroomLayout.width} height={classroomLayout.height} style={detailStyles.canvas} />
        </div>

        <div style={detailStyles.bottomBar} className="detail-bottom-bar">
          <div style={detailStyles.bottomStat}>
            <span>📹</span>
            <span>מצלמה: פעילה</span>
          </div>
          <div style={detailStyles.bottomStat}>
            <span>🎤</span>
            <span>6 מיקרופונים פעילים</span>
          </div>
          <div style={detailStyles.bottomStat}>
            <span>🧠</span>
            <span>זיהוי AI: פעיל</span>
          </div>
          <div style={detailStyles.bottomStat}>
            <span>📊</span>
            <span>דיוק: 98.5%</span>
          </div>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .detail-container {
            flex-direction: column !important;
            overflow-x: hidden !important;
          }
          .detail-sidebar {
            width: 100% !important;
            max-height: none !important;
            border-left: none !important;
            padding: 14px !important;
          }
          .detail-main {
            width: 100% !important;
            padding: 10px !important;
          }
          .detail-canvas-box canvas {
            max-width: 100% !important;
            height: auto !important;
          }
          .detail-bottom-bar {
            flex-wrap: wrap !important;
          }
        }
      `}</style>
    </div>
  );
}

// Main Dashboard Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #070b14 0%, #0f172a 50%, #070b14 100%)',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#fff',
    padding: 'clamp(12px, 3vw, 24px)',
    direction: 'rtl',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: '1px solid rgba(99,102,241,0.15)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  logoBox: {
    width: 'clamp(45px, 6vw, 60px)',
    height: 'clamp(45px, 6vw, 60px)',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(20px, 3vw, 30px)',
    boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
  },
  logoTitle: {
    fontSize: 'clamp(18px, 3vw, 28px)',
    fontWeight: 800,
    margin: 0,
    background: 'linear-gradient(90deg, #fff, #a5b4fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoSub: {
    fontSize: 12,
    color: '#64748b',
    margin: 0,
  },
  headerRight: {},
  clockBox: {
    textAlign: 'right',
    padding: '12px 20px',
    background: 'rgba(99,102,241,0.1)',
    borderRadius: 12,
    border: '1px solid rgba(99,102,241,0.15)',
  },
  clockTime: {
    fontSize: 24,
    fontWeight: 700,
    fontFamily: 'monospace',
    background: 'linear-gradient(90deg, #fff, #c7d2fe)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  clockDate: {
    fontSize: 11,
    color: '#64748b',
  },
  statsBar: {
    display: 'flex',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    background: 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.7))',
    borderRadius: 16,
    border: '1px solid rgba(99,102,241,0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 'clamp(20px, 3vw, 32px)',
    fontWeight: 800,
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  legendBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: '14px 20px',
    background: 'rgba(30,41,59,0.5)',
    borderRadius: 12,
    marginBottom: 24,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#94a3b8',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
  },
  classroomsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
    gap: 'clamp(12px, 2vw, 20px)',
  },
  classCard: {
    background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.8))',
    borderRadius: 16,
    padding: '18px 20px',
    border: '2px solid',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  className: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    flexShrink: 0,
  },
  alertTag: {
    padding: '3px 7px',
    background: 'rgba(239,68,68,0.2)',
    border: '1px solid rgba(239,68,68,0.5)',
    borderRadius: 6,
    fontSize: 9,
    fontWeight: 600,
    color: '#ef4444',
    whiteSpace: 'nowrap',
  },
  cardInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: '#94a3b8',
  },
  cardInfoItem: {
    whiteSpace: 'nowrap',
  },
  cardInfoDivider: {
    color: 'rgba(99,102,241,0.3)',
    fontSize: 10,
  },
  cardStatusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
  },
  cardStudents: {
    fontSize: 12,
    color: '#64748b',
  },
  cardStatsRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    borderTop: '1px solid rgba(99,102,241,0.1)',
    borderBottom: '1px solid rgba(99,102,241,0.1)',
  },
  cardStat: {
    flex: 1,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  cardStatNum: {
    fontSize: 18,
    fontWeight: 700,
    fontFamily: 'monospace',
    color: '#e2e8f0',
  },
  cardStatLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: 500,
  },
  cardStatDivider: {
    width: 1,
    height: 28,
    background: 'rgba(99,102,241,0.15)',
  },
  viewBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
  },
};

// Detail View Styles
const detailStyles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '100vw',
    background: 'linear-gradient(135deg, #070b14 0%, #0f172a 50%, #070b14 100%)',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#fff',
    direction: 'rtl',
    overflowX: 'hidden',
  },
  sidebar: {
    width: 'min(340px, 100vw)',
    flexShrink: 0,
    background: 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(7,11,20,0.98))',
    borderLeft: '1px solid rgba(99,102,241,0.15)',
    padding: 'clamp(12px, 3vw, 20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflowY: 'auto',
    maxHeight: '100vh',
    boxSizing: 'border-box',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 16px',
    background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 12,
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  classInfo: {
    paddingBottom: 16,
    borderBottom: '1px solid rgba(99,102,241,0.15)',
  },
  classTitle: {
    fontSize: 'clamp(18px, 2.5vw, 24px)',
    fontWeight: 700,
    margin: '0 0 12px 0',
  },
  classMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontSize: 12,
    color: '#94a3b8',
  },
  statusCard: {
    padding: 16,
    background: 'rgba(30,41,59,0.6)',
    borderRadius: 14,
    textAlign: 'center',
  },
  statusHeader: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 700,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  statBox: {
    padding: 16,
    background: 'rgba(30,41,59,0.6)',
    borderRadius: 14,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 800,
    fontFamily: 'monospace',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  card: {
    background: 'rgba(30,41,59,0.6)',
    borderRadius: 14,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: 300,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: '1px solid rgba(99,102,241,0.1)',
    flexShrink: 0,
  },
  notifList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 240,
    paddingRight: 4,
  },
  notifItem: {
    padding: '8px 10px',
    borderRadius: 8,
    borderLeft: '3px solid',
  },
  notifHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
    fontSize: 11,
  },
  notifTime: {
    fontSize: 9,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  notifMsg: {
    fontSize: 10,
    lineHeight: 1.3,
  },
  legend: {
    padding: 14,
    background: 'rgba(30,41,59,0.5)',
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 10,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  main: {
    flex: 1,
    padding: 'clamp(10px, 2vw, 20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    minWidth: 0,
    overflowX: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 'clamp(16px, 2.5vw, 22px)',
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(90deg, #fff, #c7d2fe)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  liveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid #ef4444',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 700,
    color: '#ef4444',
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    background: '#ef4444',
    boxShadow: '0 0 10px #ef4444',
    animation: 'pulse 1.5s infinite',
  },
  canvasBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(7,11,20,0.9))',
    borderRadius: 20,
    border: '1px solid rgba(99,102,241,0.1)',
    padding: 'clamp(8px, 2vw, 16px)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    overflow: 'auto',
  },
  canvas: {
    borderRadius: 14,
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    maxWidth: '100%',
    height: 'auto',
  },
  bottomBar: {
    display: 'flex',
    gap: 'clamp(8px, 1.5vw, 16px)',
    flexWrap: 'wrap',
  },
  bottomStat: {
    flex: '1 1 auto',
    minWidth: '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 'clamp(10px, 1.5vw, 14px)',
    background: 'rgba(30,41,59,0.6)',
    borderRadius: 12,
    fontSize: 'clamp(10px, 1.2vw, 12px)',
    color: '#94a3b8',
  },
  cameraFeedContainer: {
    background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(7,11,20,0.95))',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    border: '2px solid #10b981',
    boxShadow: '0 0 30px rgba(16,185,129,0.3)',
    textAlign: 'center',
  },
  cameraFeedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(16,185,129,0.3)',
    fontSize: 14,
    fontWeight: 600,
    color: '#10b981',
  },
  closeCameraBtn: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(239,68,68,0.2)',
    color: '#f87171',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCanvas: {
    width: '100%',
    maxWidth: 640,
    height: 'auto',
    borderRadius: 8,
    border: '2px solid #1e293b',
    imageRendering: 'pixelated',
    display: 'block',
    margin: '0 auto',
  },
  cameraInfo: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(99,102,241,0.2)',
    fontSize: 11,
    color: '#64748b',
  },
};