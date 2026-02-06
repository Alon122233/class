import React, { useState, useEffect, useRef, useCallback } from 'react';

// Video paths
const CHEAT_VIDEOS = {
  peeking: process.env.PUBLIC_URL + '/Peeking_at_neighbor.mp4',
  passing_notes: process.env.PUBLIC_URL + '/Passing_notes.mp4',
  head_movement: process.env.PUBLIC_URL + '/Suspicious_head_movement.mp4',
  phone_usage: process.env.PUBLIC_URL + '/Phone_usage_detected.mp4',
  hand_signals: process.env.PUBLIC_URL + '/Hand_signals_detected.mp4',
  hidden_notes: process.env.PUBLIC_URL + '/Suspected_hidden_notes.mp4',
};

// Hebrew student names pool
const STUDENT_NAMES = {
  boys: ['אדם','יוסף','דוד','נועם','איתי','עומר','דניאל','אריאל','עידו','רון','גיל','תומר','אלון','יונתן','שי','אור','ליאם','עמית','מתן','איתמר','בן','אסף','ניר','רועי','יובל','אלעד','אופיר','נדב','עדי','אייל','טל','ליאור','אורי','סהר','רם'],
  girls: ['נועה','מאיה','תמר','שירה','יעל','אביגיל','רוני','הילה','עדן','ליאן','אגם','דנה','מיכל','רותם','הדר','ליה','שקד','נעמי','אלה','ענבל','מור','אורית','נוי','גלי','איילת','קרן','טלי','סיון','שלומית','רינת','חן','ירדן','ספיר','מיטל','אלמוג'],
};

function generateStudentsForClass(classroom) {
  const count = classroom.students;
  const students = [];
  const usedNames = new Set();
  for (let i = 0; i < count; i++) {
    const isBoy = Math.random() > 0.5;
    const pool = isBoy ? STUDENT_NAMES.boys : STUDENT_NAMES.girls;
    let name;
    do { name = pool[Math.floor(Math.random() * pool.length)]; } while (usedNames.has(name) && usedNames.size < pool.length);
    usedNames.add(name);
    students.push({ id: i + 1, name: name + ' ' + String.fromCharCode(1488 + Math.floor(Math.random() * 22)) + '.', present: true, gender: isBoy ? 'boy' : 'girl' });
  }
  return students;
}

function generateSeatMap(classroom) {
  const students = generateStudentsForClass(classroom);
  const shuffled = [...students].sort(() => Math.random() - 0.5);
  const seats = [];
  let idx = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      for (let side = 0; side < 2; side++) {
        seats.push({
          row, col, side, seatIndex: seats.length,
          student: idx < shuffled.length ? shuffled[idx++] : null,
        });
      }
    }
  }
  return seats;
}

// ─── SEAT EDITOR (inline for one class) ────────────────────────
function SeatEditor({ seatMap, onUpdate, className, onClose }) {
  const [selectedSeat, setSelectedSeat] = useState(null); // tap-to-swap: selected seat index
  const [dragOverSeat, setDragOverSeat] = useState(null); // desktop drag highlight
  const isDraggingRef = useRef(false); // track if a real drag happened

  const handleSwap = (targetIndex) => {
    if (selectedSeat === null || selectedSeat === targetIndex) { setSelectedSeat(null); setDragOverSeat(null); return; }
    const next = [...seatMap];
    const temp = next[targetIndex].student;
    next[targetIndex] = { ...next[targetIndex], student: next[selectedSeat].student };
    next[selectedSeat] = { ...next[selectedSeat], student: temp };
    onUpdate(next);
    setSelectedSeat(null);
    setDragOverSeat(null);
  };

  // Click/tap handler — works on both desktop & mobile
  const handleSeatTap = (idx, seat) => {
    // If a drag just happened, skip the click
    if (isDraggingRef.current) { isDraggingRef.current = false; return; }
    if (selectedSeat === null) {
      // Nothing selected yet — select this seat if it has a student
      if (seat?.student) setSelectedSeat(idx);
    } else if (selectedSeat === idx) {
      // Tapped same seat — deselect
      setSelectedSeat(null);
    } else {
      // Second tap — swap
      handleSwap(idx);
    }
  };

  const handleReshuffle = () => {
    const students = seatMap.filter(s => s.student).map(s => s.student).sort(() => Math.random() - 0.5);
    let idx = 0;
    onUpdate(seatMap.map(seat => ({ ...seat, student: idx < students.length ? students[idx++] : null })));
    setSelectedSeat(null);
  };

  const occupiedCount = seatMap.filter(s => s.student).length;
  const selectedStudent = selectedSeat !== null ? seatMap[selectedSeat]?.student : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 8, direction: 'rtl',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '98vw', maxWidth: 820, maxHeight: '95vh', overflowY: 'auto',
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)', padding: 'clamp(10px, 3vw, 24px)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 700 }}>🪑 עריכת מושבים — {className}</div>
            <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#64748b', marginTop: 2 }}>{occupiedCount} תלמידים • לחץ על תלמיד ואז על מקום יעד להחלפה</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button onClick={handleReshuffle} style={{
              padding: '7px 12px', background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8,
              color: '#a5b4fc', fontSize: 'clamp(9px, 2vw, 11px)', fontWeight: 600, cursor: 'pointer',
            }}>🔀 ערבב</button>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)',
              background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: 16,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✕</button>
          </div>
        </div>

        {/* Selected student banner */}
        {selectedStudent && (
          <div style={{
            margin: '0 0 10px', padding: '8px 14px', borderRadius: 8,
            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 'clamp(14px, 3vw, 18px)' }}>{selectedStudent.gender === 'boy' ? '👦' : '👧'}</span>
              <span style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: 700, color: '#38bdf8' }}>
                {selectedStudent.name}
              </span>
              <span style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#64748b' }}>
                — לחץ על מקום יעד להחלפה
              </span>
            </div>
            <button onClick={() => setSelectedSeat(null)} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 'clamp(9px, 2vw, 11px)',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', cursor: 'pointer', fontWeight: 600, flexShrink: 0,
            }}>✕ ביטול</button>
          </div>
        )}

        {/* Whiteboard */}
        <div style={{
          margin: '0 auto 12px', padding: '6px 0', borderRadius: 6,
          background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(100,116,139,0.1)',
          textAlign: 'center', fontSize: 'clamp(9px, 2vw, 11px)', color: '#64748b', fontWeight: 600,
        }}>📝 לוח — חזית הכיתה</div>

        {/* Desk grid - horizontal scroll on small screens */}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
          <div style={{ minWidth: 380 }}>
            {[0,1,2,3].map(row => (
              <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'clamp(3px, 1vw, 8px)', marginBottom: 'clamp(4px, 1vw, 10px)' }}>
                {[0,1,2,3,4,5].map(col => {
                  const li = seatMap.findIndex(s => s.row === row && s.col === col && s.side === 0);
                  const ri = seatMap.findIndex(s => s.row === row && s.col === col && s.side === 1);
                  const left = seatMap[li]; const right = seatMap[ri];
                  const renderSeat = (seat, idx) => {
                    const isSelected = selectedSeat === idx;
                    const isTarget = selectedSeat !== null && selectedSeat !== idx;
                    return (
                      <div
                        draggable={!!seat?.student}
                        onDragStart={() => { isDraggingRef.current = true; setSelectedSeat(idx); }}
                        onDragOver={e => { e.preventDefault(); setDragOverSeat(idx); }}
                        onDrop={() => { isDraggingRef.current = true; handleSwap(idx); }}
                        onDragEnd={() => { setTimeout(() => { isDraggingRef.current = false; }, 50); }}
                        onClick={() => handleSeatTap(idx, seat)}
                        style={{
                          flex: 1, padding: 'clamp(3px, 0.8vw, 5px) 2px', textAlign: 'center',
                          cursor: isSelected ? 'pointer' : isTarget ? 'crosshair' : seat?.student ? 'pointer' : 'default',
                          background: isSelected ? 'rgba(56,189,248,0.18)' :
                            dragOverSeat === idx ? 'rgba(99,102,241,0.15)' :
                            (isTarget && seat?.student) ? 'rgba(139,92,246,0.08)' :
                            seat?.student ? 'rgba(16,185,129,0.04)' : 'transparent',
                          transition: 'all 0.15s',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                          minHeight: 'clamp(34px, 7vw, 44px)',
                          border: isSelected ? '2px solid rgba(56,189,248,0.6)' :
                            isTarget ? '1px dashed rgba(139,92,246,0.3)' : '1px solid transparent',
                          borderRadius: 4,
                          boxShadow: isSelected ? '0 0 12px rgba(56,189,248,0.2)' : 'none',
                        }}
                      >
                        {seat?.student ? (<>
                          <div style={{
                            width: 'clamp(16px, 4vw, 22px)', height: 'clamp(16px, 4vw, 22px)', borderRadius: 4,
                            background: isSelected ? 'rgba(56,189,248,0.3)' :
                              seat.student.gender === 'boy' ? 'rgba(56,189,248,0.15)' : 'rgba(236,72,153,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'clamp(8px, 1.8vw, 10px)',
                            color: isSelected ? '#fff' : seat.student.gender === 'boy' ? '#38bdf8' : '#f472b6',
                            transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                            transition: 'transform 0.15s',
                          }}>{seat.student.gender === 'boy' ? '👦' : '👧'}</div>
                          <div style={{
                            fontSize: 'clamp(5px, 1.5vw, 7px)', fontWeight: isSelected ? 800 : 600,
                            color: isSelected ? '#38bdf8' : '#cbd5e1',
                            maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{seat.student.name}</div>
                        </>) : (
                          <div style={{
                            fontSize: 'clamp(6px, 1.4vw, 8px)',
                            color: isTarget ? '#8b5cf6' : '#334155',
                          }}>{isTarget ? '⬇ הנח כאן' : 'ריק'}</div>
                        )}
                      </div>
                    );
                  };
                  return (
                    <div key={col} style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.08)', background: 'rgba(15,23,42,0.5)' }}>
                      <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1, borderLeft: '1px solid rgba(99,102,241,0.06)' }}>{renderSeat(left, li)}</div>
                        <div style={{ flex: 1 }}>{renderSeat(right, ri)}</div>
                      </div>
                      <div style={{ padding: '1px 0', textAlign: 'center', fontSize: 'clamp(5px, 1.2vw, 6px)', color: '#334155', background: 'rgba(15,23,42,0.3)', borderTop: '1px solid rgba(99,102,241,0.04)' }}>
                        {row+1}-{col+1}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8, fontSize: 'clamp(7px, 1.8vw, 9px)', color: '#475569', flexWrap: 'wrap' }}>
          <span>👦 בן</span><span>👧 בת</span>
          <span style={{ color: '#38bdf8' }}>■ נבחר</span>
          <span style={{ color: '#8b5cf6' }}>⬜ יעד</span>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </div>
  );
}

// ─── TEACHER CONTROL PAGE ───────────────────────────────────────
const SUBJECT_OPTIONS = [
  'מתמטיקה', 'פיזיקה', 'כימיה', 'ביולוגיה', 'אנגלית',
  'היסטוריה', 'ספרות', 'תנ"ך', 'אזרחות', 'גיאוגרפיה',
  'מדעי המחשב', 'ערבית', 'צרפתית', 'לשון', 'חינוך גופני',
];

function TeacherControl({ classrooms, onBack, onCreateEvent }) {
  const [allSeatMaps, setAllSeatMaps] = useState(() => {
    const maps = {};
    classrooms.forEach(cls => { maps[cls.id] = generateSeatMap(cls); });
    return maps;
  });
  const [editingClassId, setEditingClassId] = useState(null);
  const [classSubjects, setClassSubjects] = useState(() => {
    const subs = {};
    classrooms.forEach(cls => { subs[cls.id] = cls.subject; });
    return subs;
  });
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [includedClassIds, setIncludedClassIds] = useState(() => classrooms.map(c => c.id));
  const [classOverrides, setClassOverrides] = useState({});
  const [editingDetailsId, setEditingDetailsId] = useState(null);

  const handleUpdateSeats = (classId, newMap) => {
    setAllSeatMaps(prev => ({ ...prev, [classId]: newMap }));
  };

  const removeClassFromEvent = (classId) => {
    setIncludedClassIds(prev => prev.filter(id => id !== classId));
  };

  const restoreClass = (classId) => {
    setIncludedClassIds(prev => [...prev, classId]);
  };

  const getClassDisplay = (cls) => {
    const overrides = classOverrides[cls.id] || {};
    return {
      name: overrides.name ?? cls.name,
      teacher: overrides.teacher ?? cls.teacher,
    };
  };

  const handleCreate = () => {
    const included = classrooms.filter(c => includedClassIds.includes(c.id));
    if (included.length === 0) return;
    onCreateEvent({
      seatMaps: allSeatMaps,
      classrooms: included.map(c => {
        const display = getClassDisplay(c);
        return {
          id: c.id, name: display.name, teacher: display.teacher,
          examSubject: classSubjects[c.id] || c.subject,
          subject: c.subject, grade: c.grade,
          studentCount: allSeatMaps[c.id].filter(s => s.student).length,
        };
      }),
    });
  };

  const includedClasses = classrooms.filter(c => includedClassIds.includes(c.id));
  const removedClasses = classrooms.filter(c => !includedClassIds.includes(c.id));
  const editingClass = classrooms.find(c => c.id === editingClassId);
  const editingDisplay = editingClass ? getClassDisplay(editingClass) : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#fff', padding: 'clamp(12px, 3vw, 24px)', direction: 'rtl',
    }}>
      {/* Editor popup */}
      {editingClassId && allSeatMaps[editingClassId] && (
        <SeatEditor
          seatMap={allSeatMaps[editingClassId]}
          onUpdate={(newMap) => handleUpdateSeats(editingClassId, newMap)}
          className={editingDisplay?.name || ''}
          onClose={() => setEditingClassId(null)}
        />
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'clamp(14px, 3vw, 24px)', paddingBottom: 'clamp(12px, 2vw, 20px)',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
        flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 14px)', minWidth: 0 }}>
          <div style={{
            width: 'clamp(36px, 8vw, 48px)', height: 'clamp(36px, 8vw, 48px)', borderRadius: 'clamp(10px, 2vw, 14px)', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(18px, 4vw, 24px)', boxShadow: '0 6px 24px rgba(99,102,241,0.3)',
          }}>📝</div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(16px, 4vw, 22px)', fontWeight: 800, margin: 0,
              background: 'linear-gradient(90deg, #fff, #a5b4fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>יצירת אירוע מבחן חדש</h1>
            <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#64748b', marginTop: 2 }}>כל הכיתות מוכנות עם מיפוי מושבים אקראי</div>
          </div>
        </div>
        <button onClick={onBack} style={{
          padding: 'clamp(7px, 1.5vw, 10px) clamp(12px, 2.5vw, 20px)', background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10,
          color: '#a5b4fc', fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
        }}>🏠 חזרה לראשי</button>
      </div>

      {/* All classes grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'clamp(10px, 2vw, 16px)', marginBottom: 'clamp(16px, 3vw, 24px)' }}>
        {includedClasses.map(cls => {
          const seats = allSeatMaps[cls.id] || [];
          const occupied = seats.filter(s => s.student).length;
          const currentSubject = classSubjects[cls.id] || cls.subject;
          const isDropdownOpen = openDropdownId === cls.id;
          const display = getClassDisplay(cls);
          const isEditingDetails = editingDetailsId === cls.id;
          return (
            <div key={cls.id} style={{
              padding: 'clamp(12px, 2.5vw, 18px)', borderRadius: 'clamp(12px, 2vw, 16px)',
              background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,41,59,0.5))',
              border: '1px solid rgba(99,102,241,0.1)',
              transition: 'all 0.3s', position: 'relative',
            }}>
              {/* Remove button */}
              <button onClick={() => removeClassFromEvent(cls.id)} title="הסר כיתה" style={{
                position: 'absolute', top: 4, left: 4, zIndex: 10,
                width: 18, height: 18, borderRadius: '50%', padding: 0,
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', fontSize: 10, lineHeight: '16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
              >✕</button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', marginBottom: 'clamp(10px, 2vw, 14px)' }}>
                <div style={{
                  width: 'clamp(32px, 7vw, 40px)', height: 'clamp(32px, 7vw, 40px)', borderRadius: 'clamp(8px, 1.5vw, 10px)', flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(14px, 3vw, 18px)',
                }}>🏫</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: 700 }}>{display.name}</div>
                  <div style={{ fontSize: 'clamp(9px, 2vw, 10px)', color: '#64748b' }}>{display.teacher} • {cls.grade}</div>
                </div>
                <div style={{
                  padding: '3px 8px', borderRadius: 6, fontSize: 'clamp(8px, 1.8vw, 10px)', fontWeight: 700, flexShrink: 0,
                  background: 'rgba(16,185,129,0.08)', color: '#10b981',
                  border: '1px solid rgba(16,185,129,0.15)',
                }}>✓ מוכן</div>
              </div>

              {/* Edit class details inline */}
              {isEditingDetails && (
                <div style={{
                  marginBottom: 10, padding: 10, borderRadius: 10,
                  background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 'clamp(9px, 1.8vw, 10px)', color: '#94a3b8' }}>שם כיתה</label>
                    <input
                      value={display.name}
                      onChange={e => setClassOverrides(prev => ({
                        ...prev, [cls.id]: { ...prev[cls.id], name: e.target.value }
                      }))}
                      style={{
                        padding: '6px 10px', borderRadius: 6,
                        background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.2)',
                        color: '#e2e8f0', fontSize: 'clamp(11px, 2.2vw, 13px)', direction: 'rtl',
                        outline: 'none',
                      }}
                    />
                    <label style={{ fontSize: 'clamp(9px, 1.8vw, 10px)', color: '#94a3b8', marginTop: 2 }}>שם מורה</label>
                    <input
                      value={display.teacher}
                      onChange={e => setClassOverrides(prev => ({
                        ...prev, [cls.id]: { ...prev[cls.id], teacher: e.target.value }
                      }))}
                      style={{
                        padding: '6px 10px', borderRadius: 6,
                        background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.2)',
                        color: '#e2e8f0', fontSize: 'clamp(11px, 2.2vw, 13px)', direction: 'rtl',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <button onClick={() => setEditingDetailsId(null)} style={{
                    marginTop: 8, padding: '5px 14px', borderRadius: 6,
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                    color: '#10b981', fontSize: 'clamp(9px, 1.8vw, 11px)', fontWeight: 600, cursor: 'pointer',
                  }}>✓ סיום עריכה</button>
                </div>
              )}

              {/* Per-class subject selector */}
              <div style={{ marginBottom: 10, position: 'relative' }}>
                <button onClick={() => setOpenDropdownId(isDropdownOpen ? null : cls.id)} style={{
                  width: '100%', padding: 'clamp(6px, 1.2vw, 8px) clamp(10px, 2vw, 12px)',
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
                  color: '#fbbf24', fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 600, cursor: 'pointer',
                }}>
                  <span>📚 {currentSubject}</span>
                  <span style={{ fontSize: 10 }}>{isDropdownOpen ? '▲' : '▼'}</span>
                </button>
                {isDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                    marginTop: 4, padding: 6, borderRadius: 10,
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                    display: 'flex', flexWrap: 'wrap', gap: 4,
                    maxHeight: 160, overflowY: 'auto',
                  }}>
                    {SUBJECT_OPTIONS.map(subj => (
                      <button key={subj} onClick={() => {
                        setClassSubjects(prev => ({ ...prev, [cls.id]: subj }));
                        setOpenDropdownId(null);
                      }} style={{
                        padding: '4px 10px', borderRadius: 6,
                        background: currentSubject === subj ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(245,158,11,0.06)',
                        border: currentSubject === subj ? '1px solid #f59e0b' : '1px solid rgba(245,158,11,0.12)',
                        color: currentSubject === subj ? '#fff' : '#fbbf24',
                        fontSize: 'clamp(9px, 1.8vw, 11px)', fontWeight: currentSubject === subj ? 700 : 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>{subj}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mini seat preview */}
              <div style={{
                padding: 8, borderRadius: 10, marginBottom: 12,
                background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(99,102,241,0.06)',
              }}>
                {[0,1,2,3].map(row => (
                  <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, marginBottom: 2 }}>
                    {[0,1,2,3,4,5].map(col => {
                      const left = seats.find(s => s.row === row && s.col === col && s.side === 0);
                      const right = seats.find(s => s.row === row && s.col === col && s.side === 1);
                      return (
                        <div key={col} style={{ display: 'flex', height: 12, borderRadius: 2, overflow: 'hidden', background: 'rgba(15,23,42,0.4)' }}>
                          <div style={{
                            flex: 1, borderLeft: '1px solid rgba(99,102,241,0.04)',
                            background: left?.student ? (left.student.gender === 'boy' ? 'rgba(56,189,248,0.12)' : 'rgba(236,72,153,0.12)') : 'transparent',
                          }} />
                          <div style={{
                            flex: 1,
                            background: right?.student ? (right.student.gender === 'boy' ? 'rgba(56,189,248,0.12)' : 'rgba(236,72,153,0.12)') : 'transparent',
                          }} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>👥 {occupied} תלמידים</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditingDetailsId(isEditingDetails ? null : cls.id)} style={{
                    padding: 'clamp(6px, 1.2vw, 8px) clamp(10px, 2vw, 14px)', borderRadius: 8,
                    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
                    color: '#fbbf24', fontSize: 'clamp(9px, 1.8vw, 11px)', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>✏️ ערוך פרטים</button>
                  <button onClick={() => setEditingClassId(cls.id)} style={{
                    padding: 'clamp(6px, 1.2vw, 8px) clamp(10px, 2vw, 14px)', borderRadius: 8,
                    background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)',
                    color: '#7dd3fc', fontSize: 'clamp(9px, 1.8vw, 11px)', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>🪑 ערוך מושבים</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Removed classes restore bar */}
      {removedClasses.length > 0 && (
        <div style={{
          marginBottom: 'clamp(14px, 3vw, 20px)', padding: 'clamp(10px, 2vw, 16px)',
          borderRadius: 'clamp(10px, 2vw, 14px)',
          background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)',
        }}>
          <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#f87171', marginBottom: 8, fontWeight: 600 }}>
            🚫 כיתות שהוסרו ({removedClasses.length})
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {removedClasses.map(cls => (
              <button key={cls.id} onClick={() => restoreClass(cls.id)} style={{
                padding: 'clamp(5px, 1vw, 7px) clamp(10px, 2vw, 14px)',
                borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                color: '#a5b4fc', fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; }}
              >
                <span style={{ color: '#10b981', fontSize: 'clamp(11px, 2.2vw, 14px)' }}>+</span>
                {cls.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create button */}
      <button onClick={handleCreate} disabled={includedClasses.length === 0} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(6px, 1.5vw, 10px)',
        width: '100%', maxWidth: 600, margin: '0 auto', padding: 'clamp(14px, 3vw, 18px) clamp(16px, 4vw, 32px)',
        background: includedClasses.length === 0
          ? 'rgba(100,116,139,0.2)'
          : 'linear-gradient(135deg, #10b981, #059669)',
        border: 'none', borderRadius: 'clamp(10px, 2vw, 14px)',
        color: includedClasses.length === 0 ? '#64748b' : '#fff',
        fontSize: 'clamp(14px, 3vw, 17px)', fontWeight: 700,
        cursor: includedClasses.length === 0 ? 'not-allowed' : 'pointer',
        boxShadow: includedClasses.length === 0 ? 'none' : '0 8px 32px rgba(16,185,129,0.35)',
        transition: 'all 0.3s',
      }}
      onMouseEnter={e => { if (includedClasses.length > 0) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(16,185,129,0.5)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = includedClasses.length === 0 ? 'none' : '0 8px 32px rgba(16,185,129,0.35)'; }}
      >
        <span style={{ fontSize: 22 }}>📝</span>
        צור אירוע מבחן ({includedClasses.length} כיתות)
      </button>
    </div>
  );
}

// ─── EVENTS PAGE ────────────────────────────────────────────────
function EventsPage({ events, setEvents, classrooms, onBack, onCreateNew, onStartExam, fadeIn }) {
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [editingSeatClassId, setEditingSeatClassId] = useState(null);
  const [editingSeatEventId, setEditingSeatEventId] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // ── PDF Generation (Canvas-based for Hebrew support) ──
  const generateSeatMapPDF = async (event) => {
    setPdfLoading(true);
    try {
      // Load jsPDF
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4', hotfixes: ['px_scaling'] });
      const dateStr = event.createdAt.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = event.createdAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

      // Canvas dimensions (A4 landscape at 2x for crisp text)
      const W = 1684, H = 1190;

      for (let ci = 0; ci < event.classrooms.length; ci++) {
        if (ci > 0) doc.addPage();
        const cls = event.classrooms[ci];
        const seats = event.seatMaps[cls.id] || [];
        const subjectName = cls.examSubject || cls.subject || 'מבחן';

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // ── Background ──
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // ── Page border ──
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 20, W - 40, H - 40);

        // ── Header ──
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 42px "Segoe UI", Arial, sans-serif';
        ctx.fillText(cls.name, W / 2, 72);

        ctx.fillStyle = '#64748b';
        ctx.font = '24px "Segoe UI", Arial, sans-serif';
        ctx.fillText(`${cls.teacher}  |  מקצוע: ${subjectName}  |  ${cls.grade}  |  ${dateStr}  ${timeStr}`, W / 2, 108);

        ctx.fillStyle = '#6366f1';
        ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.fillText(`${cls.studentCount} תלמידים`, W / 2, 138);

        // ── Whiteboard ──
        const boardY = 158;
        ctx.fillStyle = '#e2e8f0';
        const bw = 400, bh = 36;
        ctx.beginPath();
        ctx.roundRect(W / 2 - bw / 2, boardY, bw, bh, 10);
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        ctx.fillText('לוח', W / 2, boardY + 24);

        // ── Desk Grid ──
        const gridStartY = 215;
        const deskW = 230, deskH = 170, gapX = 24, gapY = 22;
        const cols = 6, rows = 4;
        const totalGridW = cols * deskW + (cols - 1) * gapX;
        const startX = (W - totalGridW) / 2;

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const x = startX + col * (deskW + gapX);
            const y = gridStartY + row * (deskH + gapY);

            const leftSeat = seats.find(s => s.row === row && s.col === col && s.side === 0);
            const rightSeat = seats.find(s => s.row === row && s.col === col && s.side === 1);

            // Desk border
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x, y, deskW, deskH, 8);
            ctx.stroke();

            // Center divider
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + deskW / 2, y + 8);
            ctx.lineTo(x + deskW / 2, y + deskH - 24);
            ctx.stroke();

            // Desk number label
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '12px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${row + 1}-${col + 1}`, x + deskW / 2, y + deskH - 6);

            // Draw a seat
            const drawSeat = (seat, sx, sw) => {
              if (seat?.student) {
                const isBoy = seat.student.gender === 'boy';
                // Seat background
                ctx.fillStyle = isBoy ? '#dbeafe' : '#fce7f3';
                ctx.beginPath();
                ctx.roundRect(sx + 4, y + 6, sw - 8, deskH - 34, 6);
                ctx.fill();

                // Border
                ctx.strokeStyle = isBoy ? '#93c5fd' : '#f9a8d4';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.roundRect(sx + 4, y + 6, sw - 8, deskH - 34, 6);
                ctx.stroke();

                // Gender icon
                ctx.fillStyle = isBoy ? '#2563eb' : '#db2777';
                ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(isBoy ? '👦' : '👧', sx + sw / 2, y + 38);

                // Name
                ctx.fillStyle = '#1e293b';
                ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
                let name = seat.student.name;
                if (name.length > 12) name = name.substring(0, 11) + '..';
                ctx.fillText(name, sx + sw / 2, y + 62);

                // Student ID
                ctx.fillStyle = '#94a3b8';
                ctx.font = '12px "Segoe UI", Arial, sans-serif';
                ctx.fillText(`#${seat.student.id}`, sx + sw / 2, y + 80);
              } else {
                // Empty seat
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.roundRect(sx + 4, y + 6, sw - 8, deskH - 34, 6);
                ctx.fill();
                ctx.fillStyle = '#e2e8f0';
                ctx.font = '14px "Segoe UI", Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('—', sx + sw / 2, y + 50);
              }
            };

            drawSeat(leftSeat, x, deskW / 2);
            drawSeat(rightSeat, x + deskW / 2, deskW / 2);
          }
        }

        // ── Legend ──
        const legendY = gridStartY + rows * (deskH + gapY) + 10;
        ctx.textAlign = 'right';

        // Boy legend
        ctx.fillStyle = '#dbeafe';
        ctx.beginPath();
        ctx.roundRect(W - 120, legendY, 30, 18, 4);
        ctx.fill();
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(W - 120, legendY, 30, 18, 4);
        ctx.stroke();
        ctx.fillStyle = '#475569';
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('👦 בן', W - 130, legendY + 14);

        // Girl legend
        ctx.fillStyle = '#fce7f3';
        ctx.beginPath();
        ctx.roundRect(W - 250, legendY, 30, 18, 4);
        ctx.fill();
        ctx.strokeStyle = '#f9a8d4';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(W - 250, legendY, 30, 18, 4);
        ctx.stroke();
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'right';
        ctx.fillText('👧 בת', W - 260, legendY + 14);

        // Page number
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${ci + 1} / ${event.classrooms.length} עמוד`, 50, legendY + 14);

        // ── Footer ──
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CatCheat — מערכת ניטור חכמה למניעת העתקות', W / 2, H - 30);

        // ── Add canvas to PDF ──
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdfW = doc.internal.pageSize.getWidth();
        const pdfH = doc.internal.pageSize.getHeight();
        doc.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
      }

      doc.save(`מפת-מושבים-${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('שגיאה ביצירת PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const editingEvent = events.find(e => e.id === editingSeatEventId);
  const editingClass = editingEvent?.classrooms?.find(c => c.id === editingSeatClassId);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#fff', padding: 'clamp(16px, 3vw, 32px)', direction: 'rtl',
      opacity: fadeIn ? 1 : 0, transition: 'opacity 0.6s ease',
    }}>

      {/* Seat Editor Popup */}
      {editingSeatEventId && editingSeatClassId && editingEvent?.seatMaps?.[editingSeatClassId] && (
        <SeatEditor
          seatMap={editingEvent.seatMaps[editingSeatClassId]}
          onUpdate={(newMap) => {
            setEvents(prev => prev.map(e => e.id === editingSeatEventId
              ? { ...e, seatMaps: { ...e.seatMaps, [editingSeatClassId]: newMap } }
              : e
            ));
          }}
          className={editingClass?.name || ''}
          onClose={() => { setEditingSeatClassId(null); setEditingSeatEventId(null); }}
        />
      )}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'clamp(16px, 3vw, 28px)', paddingBottom: 'clamp(12px, 2.5vw, 20px)',
        borderBottom: '1px solid rgba(99,102,241,0.12)',
        flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 14px)', minWidth: 0 }}>
          <div style={{
            width: 'clamp(36px, 8vw, 48px)', height: 'clamp(36px, 8vw, 48px)', borderRadius: 'clamp(10px, 2vw, 14px)', flexShrink: 0,
            background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'clamp(18px, 4vw, 24px)', boxShadow: '0 6px 24px rgba(14,165,233,0.3)',
          }}>📋</div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800, margin: 0,
              background: 'linear-gradient(90deg, #fff, #7dd3fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>אירועים מתוכננים</h1>
            <div style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#64748b', marginTop: 2 }}>{events.length} אירועי מבחן</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={onCreateNew} style={{
            padding: 'clamp(7px, 1.5vw, 10px) clamp(10px, 2vw, 18px)', background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10,
            color: '#a5b4fc', fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 600, cursor: 'pointer',
          }}>📝 צור חדש</button>
          <button onClick={onBack} style={{
            padding: 'clamp(7px, 1.5vw, 10px) clamp(10px, 2vw, 18px)', background: 'rgba(56,189,248,0.08)',
            border: '1px solid rgba(56,189,248,0.15)', borderRadius: 10,
            color: '#7dd3fc', fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 600, cursor: 'pointer',
          }}>🏠 ראשי</button>
        </div>
      </div>

      {/* Empty state */}
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', maxWidth: 400, margin: '0 auto' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📭</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>אין אירועים מתוכננים</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>צור אירוע מבחן חדש כדי להתחיל</div>
          <button onClick={onCreateNew} style={{
            padding: '14px 28px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 6px 24px rgba(99,102,241,0.3)',
          }}>📝 צור אירוע חדש</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {events.map(event => {
            const isExpanded = expandedEventId === event.id;
            const totalStudents = event.classrooms.reduce((sum, c) => sum + c.studentCount, 0);
            return (
              <div key={event.id} style={{
                borderRadius: 18,
                background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,41,59,0.5))',
                border: event.status === 'active' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(99,102,241,0.1)',
                overflow: 'hidden', transition: 'all 0.3s',
              }}>
                {/* Event Header */}
                <div style={{ padding: 'clamp(12px, 3vw, 20px) clamp(12px, 3vw, 22px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 14px)', marginBottom: 10 }}>
                    <div style={{
                      width: 'clamp(38px, 8vw, 50px)', height: 'clamp(38px, 8vw, 50px)', borderRadius: 'clamp(10px, 2vw, 14px)', flexShrink: 0,
                      background: event.status === 'active'
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'clamp(18px, 4vw, 24px)', boxShadow: event.status === 'active'
                        ? '0 6px 20px rgba(16,185,129,0.3)'
                        : '0 6px 20px rgba(99,102,241,0.3)',
                    }}>{event.status === 'active' ? '▶' : '📝'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'clamp(14px, 3vw, 17px)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        מבחן — {event.classrooms.length} כיתות
                        <span style={{
                          padding: '3px 8px', borderRadius: 6, fontSize: 'clamp(8px, 1.5vw, 9px)', fontWeight: 700,
                          background: event.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.1)',
                          color: event.status === 'active' ? '#10b981' : '#f59e0b',
                        }}>{event.status === 'active' ? '● פעיל' : '◌ ממתין'}</span>
                      </div>
                      <div style={{ fontSize: 'clamp(9px, 1.8vw, 10px)', color: '#64748b', marginTop: 3 }}>
                        👥 {totalStudents} תלמידים • 🕐 {event.createdAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} • {event.createdAt.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
                      </div>
                    </div>
                  </div>

                  {/* Actions - wraps on mobile */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {event.status !== 'active' && (
                      <button onClick={() => onStartExam(event)} style={{
                        padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 18px)', borderRadius: 10,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: 'none', color: '#fff', fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: 700,
                        cursor: 'pointer', boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                        display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 auto',
                        justifyContent: 'center',
                      }}>▶ התחל מבחן</button>
                    )}
                    {event.status === 'active' && (
                      <button onClick={() => onStartExam(event)} style={{
                        padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 18px)', borderRadius: 10,
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        border: 'none', color: '#fff', fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: 700,
                        cursor: 'pointer', boxShadow: '0 4px 16px rgba(14,165,233,0.3)',
                        display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 auto',
                        justifyContent: 'center',
                      }}>📊 דשבורד</button>
                    )}
                    <button onClick={() => generateSeatMapPDF(event)} disabled={pdfLoading} style={{
                      padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 18px)', borderRadius: 10,
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      border: 'none', color: '#fff', fontSize: 'clamp(11px, 2vw, 12px)', fontWeight: 700,
                      cursor: pdfLoading ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                      display: 'flex', alignItems: 'center', gap: 6,
                      opacity: pdfLoading ? 0.7 : 1,
                    }}>{pdfLoading ? '⏳' : '📥'} מפת מושבים PDF</button>
                    <button onClick={() => setExpandedEventId(isExpanded ? null : event.id)} style={{
                      padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 1.8vw, 14px)', borderRadius: 10,
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                      color: '#a5b4fc', fontSize: 'clamp(11px, 2vw, 12px)', cursor: 'pointer',
                    }}>{isExpanded ? '▲' : '▼'} כיתות</button>
                    <button onClick={() => setEvents(prev => prev.filter(e => e.id !== event.id))} style={{
                      padding: 'clamp(8px, 1.5vw, 10px) clamp(8px, 1.5vw, 12px)', borderRadius: 10,
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                      color: '#f87171', fontSize: 'clamp(11px, 2vw, 12px)', cursor: 'pointer',
                    }}>🗑️</button>
                  </div>
                </div>

                {/* Classes mini strip */}
                <div style={{
                  padding: '0 clamp(12px, 3vw, 22px) clamp(10px, 2vw, 14px)', display: 'flex', gap: 4, flexWrap: 'wrap',
                }}>
                  {event.classrooms.map(cls => (
                    <span key={cls.id} style={{
                      padding: '3px 8px', borderRadius: 5, fontSize: 'clamp(8px, 1.5vw, 9px)',
                      background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)',
                      color: '#94a3b8',
                    }}>{cls.name} • {cls.examSubject || cls.subject} ({cls.studentCount})</span>
                  ))}
                </div>

                {/* Expanded: Class details */}
                {isExpanded && (
                  <div style={{
                    padding: '0 clamp(12px, 3vw, 22px) clamp(12px, 3vw, 20px)',
                    borderTop: '1px solid rgba(99,102,241,0.08)',
                  }}>
                    <div style={{ fontSize: 'clamp(10px, 2vw, 12px)', color: '#94a3b8', fontWeight: 600, margin: 'clamp(10px, 2vw, 16px) 0 clamp(8px, 1.5vw, 12px)' }}>
                      📚 כיתות באירוע — לחץ "ערוך" לשינוי מושבים
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: 'clamp(6px, 1.5vw, 10px)' }}>
                      {event.classrooms.map(cls => {
                        const seats = event.seatMaps[cls.id] || [];
                        return (
                          <div key={cls.id} style={{
                            padding: 14, borderRadius: 12,
                            background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(99,102,241,0.08)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>{cls.name}</div>
                                <div style={{ fontSize: 9, color: '#64748b' }}>{cls.teacher} • {cls.subject}</div>
                              </div>
                              <button onClick={() => {
                                setEditingSeatEventId(event.id);
                                setEditingSeatClassId(cls.id);
                              }} style={{
                                padding: '6px 12px', borderRadius: 6,
                                background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.12)',
                                color: '#7dd3fc', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                              }}>🪑 ערוך</button>
                            </div>

                            {/* Mini seat map */}
                            <div style={{ borderRadius: 6, overflow: 'hidden' }}>
                              {[0,1,2,3].map(row => (
                                <div key={row} style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, marginBottom: 1 }}>
                                  {[0,1,2,3,4,5].map(col => {
                                    const l = seats.find(s => s.row === row && s.col === col && s.side === 0);
                                    const r = seats.find(s => s.row === row && s.col === col && s.side === 1);
                                    return (
                                      <div key={col} style={{ display: 'flex', height: 8, background: 'rgba(15,23,42,0.3)' }}>
                                        <div style={{ flex: 1, background: l?.student ? (l.student.gender === 'boy' ? 'rgba(56,189,248,0.15)' : 'rgba(236,72,153,0.15)') : 'transparent' }} />
                                        <div style={{ flex: 1, background: r?.student ? (r.student.gender === 'boy' ? 'rgba(56,189,248,0.15)' : 'rgba(236,72,153,0.15)') : 'transparent' }} />
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: 9, color: '#475569', marginTop: 6 }}>👥 {cls.studentCount} תלמידים</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  // Animated particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.opacity})`;
        ctx.fill();
        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`;
            ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => onLogin(), 1800);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #1e1b4b 70%, #020617 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Glowing orbs */}
      <div style={{
        position: 'absolute', top: '20%', left: '15%', width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '10%', width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 'clamp(20px, 5vw, 40px)', width: '100%', maxWidth: 460, padding: '0 clamp(12px, 3vw, 24px)',
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(10px, 2.5vw, 16px)' }}>
          <div style={{
            width: 'clamp(56px, 14vw, 80px)', height: 'clamp(56px, 14vw, 80px)', borderRadius: 'clamp(16px, 4vw, 24px)',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 60px rgba(99,102,241,0.5), 0 0 120px rgba(99,102,241,0.2)',
            position: 'relative',
          }}>
            <img src={process.env.PUBLIC_URL + '/Logo.png'} alt="CatCheat"
              style={{ width: '55%', height: '55%', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="font-size:32px">🛡️</span>'; }}
            />
          </div>
          <div>
            <h1 style={{
              fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 800, margin: 0, letterSpacing: '-0.5px',
              background: 'linear-gradient(135deg, #fff 0%, #c7d2fe 50%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>CatCheat</h1>
            <p style={{
              fontSize: 'clamp(10px, 2.5vw, 14px)', color: '#64748b', margin: '6px 0 0', letterSpacing: '2px',
              textTransform: 'uppercase', fontWeight: 500,
            }}>Smart Exam Monitoring</p>
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          width: '100%', padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 36px)',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,41,59,0.6))',
          backdropFilter: 'blur(40px)', borderRadius: 24,
          border: '1px solid rgba(99,102,241,0.15)',
          boxShadow: '0 25px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}>
          <h2 style={{
            fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 700, color: '#e2e8f0', margin: '0 0 8px',
            textAlign: 'center',
          }}>ברוכים הבאים</h2>
          <p style={{ fontSize: 'clamp(11px, 2.5vw, 13px)', color: '#64748b', margin: '0 0 clamp(16px, 4vw, 28px)', textAlign: 'center' }}>
            התחבר למערכת הניטור החכמה
          </p>

          <div onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.5vw, 16px)' }}>
            <div>
              <label style={{ fontSize: 'clamp(10px, 2.2vw, 12px)', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6, textAlign: 'right' }}>
                דואר אלקטרוני
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@school.edu"
                style={{
                  width: '100%', padding: 'clamp(10px, 2.5vw, 14px) clamp(12px, 2.5vw, 16px)', background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'clamp(8px, 2vw, 12px)', color: '#e2e8f0',
                  fontSize: 'clamp(13px, 3vw, 14px)', outline: 'none', direction: 'ltr', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
              />
            </div>
            <div>
              <label style={{ fontSize: 'clamp(10px, 2.2vw, 12px)', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6, textAlign: 'right' }}>
                סיסמה
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: 'clamp(10px, 2.5vw, 14px) clamp(12px, 2.5vw, 16px)', background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'clamp(8px, 2vw, 12px)', color: '#e2e8f0',
                  fontSize: 'clamp(13px, 3vw, 14px)', outline: 'none', direction: 'ltr', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.2)'}
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: '100%', padding: 'clamp(12px, 3vw, 16px)', marginTop: 8,
                background: loading
                  ? 'linear-gradient(135deg, #4f46e5, #6d28d9)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: 'clamp(10px, 2vw, 14px)', color: '#fff', fontSize: 'clamp(14px, 3vw, 16px)',
                fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block',
                  }} />
                  מתחבר למערכת...
                </>
              ) : 'כניסה למערכת'}
            </button>
          </div>
        </div>

        {/* Bottom badges */}
        <div style={{
          display: 'flex', gap: 'clamp(8px, 2vw, 20px)', alignItems: 'center', justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {['🔒 הצפנת AES-256', '🧠 AI מבוסס', '☁️ ענן מאובטח'].map((badge, i) => (
            <span key={i} style={{
              fontSize: 'clamp(9px, 2vw, 11px)', color: '#475569', padding: 'clamp(4px, 1vw, 6px) clamp(8px, 2vw, 14px)',
              background: 'rgba(15,23,42,0.5)', borderRadius: 20,
              border: '1px solid rgba(99,102,241,0.1)',
            }}>{badge}</span>
          ))}
        </div>

        <p style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#334155', textAlign: 'center' }}>
          CatCheat © 2025 — מערכת ניטור כיתות חכמה מבוססת בינה מלאכותית
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─── VIDEO PREVIEW OVERLAY ────────────────────────────────────────
function VideoPreviewOverlay({ videoSrc, onClose }) {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const userPausedRef = useRef(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    userPausedRef.current = false;

    const tryPlay = () => {
      const p = v.play();
      if (p) p.catch(() => {
        v.muted = true;
        v.play().catch(() => {});
      });
    };

    // Resume if browser auto-pauses (not user-initiated)
    const onPause = () => {
      if (userPausedRef.current) return;
      setTimeout(() => {
        if (v && v.paused && !v.ended && !userPausedRef.current) tryPlay();
      }, 150);
    };

    const onStalled = () => {
      setTimeout(() => {
        if (v && v.paused && !userPausedRef.current) tryPlay();
      }, 300);
    };

    const onEnded = () => {
      v.currentTime = 0;
      tryPlay();
    };

    // Detect user clicking pause via controls
    const onPointerDown = () => { userPausedRef.current = true; };
    const onPlay = () => { userPausedRef.current = false; };

    v.addEventListener('pause', onPause);
    v.addEventListener('stalled', onStalled);
    v.addEventListener('ended', onEnded);
    v.addEventListener('pointerdown', onPointerDown);
    v.addEventListener('play', onPlay);

    tryPlay();

    return () => {
      v.removeEventListener('pause', onPause);
      v.removeEventListener('stalled', onStalled);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('pointerdown', onPointerDown);
      v.removeEventListener('play', onPlay);
    };
  }, [videoSrc]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(12px)',
    }} onClick={onClose}>
      <div style={{
        position: 'relative', width: '96vw', maxWidth: 1100, borderRadius: 'clamp(12px, 3vw, 20px)',
        overflow: 'hidden', border: '2px solid rgba(99,102,241,0.5)',
        boxShadow: '0 0 80px rgba(99,102,241,0.4), 0 0 200px rgba(99,102,241,0.1)',
        background: '#000', maxHeight: '95vh',
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 'clamp(8px, 2vw, 16px)', right: 'clamp(8px, 2vw, 16px)', width: 'clamp(32px, 7vw, 44px)', height: 'clamp(32px, 7vw, 44px)',
          borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)',
          background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 'clamp(16px, 3vw, 22px)', fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10001, transition: 'all 0.2s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
        onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.9)'; e.target.style.borderColor = '#ef4444'; }}
        onMouseLeave={e => { e.target.style.background = 'rgba(0,0,0,0.8)'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}
        >✕</button>

        <div style={{
          padding: 'clamp(8px, 2vw, 14px) clamp(12px, 3vw, 24px)', background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(7,11,20,0.95))',
          borderBottom: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center',
          gap: 'clamp(6px, 1.5vw, 12px)', fontSize: 'clamp(11px, 2.5vw, 15px)', fontWeight: 700, color: '#a5b4fc', direction: 'rtl',
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 20 }}>📹</span>
          <span>הקלטת מצלמה — זיהוי AI</span>
          <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              padding: '4px 12px', background: 'rgba(239,68,68,0.25)',
              border: '1px solid rgba(239,68,68,0.5)', borderRadius: 12, fontSize: 11,
              color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
                boxShadow: '0 0 8px #ef4444', animation: 'pulse 1.5s infinite' }} />
              REC
            </span>
          </div>
        </div>

        <div style={{ position: 'relative', background: '#000', width: '100%' }}>
          {videoError ? (
            <div style={{
              width: '100%', height: '60vh', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 20,
              background: 'linear-gradient(135deg, #0a0f1a, #151c2c)',
            }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
                border: '3px solid rgba(99,102,241,0.4)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 50,
              }}>🎭</div>
              <div style={{ color: '#94a3b8', fontSize: 16, fontWeight: 600 }}>הקלטת וידאו לא זמינה</div>
              <div style={{ color: '#475569', fontSize: 12, maxWidth: 300, textAlign: 'center' }}>
                וודא שקבצי הוידאו נמצאים בתיקיית public
              </div>
            </div>
          ) : (
            <video ref={videoRef} src={videoSrc} controls autoPlay loop playsInline onError={() => setVideoError(true)}
              style={{ display: 'block', width: '100%', maxHeight: '72vh', objectFit: 'contain', background: '#000' }} />
          )}
          {/* Corner brackets */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderTop: '3px solid rgba(16,185,129,0.7)', borderLeft: '3px solid rgba(16,185,129,0.7)' }} />
            <div style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderTop: '3px solid rgba(16,185,129,0.7)', borderRight: '3px solid rgba(16,185,129,0.7)' }} />
            <div style={{ position: 'absolute', bottom: 16, left: 16, width: 40, height: 40, borderBottom: '3px solid rgba(16,185,129,0.7)', borderLeft: '3px solid rgba(16,185,129,0.7)' }} />
            <div style={{ position: 'absolute', bottom: 16, right: 16, width: 40, height: 40, borderBottom: '3px solid rgba(16,185,129,0.7)', borderRight: '3px solid rgba(16,185,129,0.7)' }} />
          </div>
        </div>

        <div style={{
          padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 24px)', background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(7,11,20,0.95))',
          borderTop: '1px solid rgba(99,102,241,0.2)', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', direction: 'rtl',
          flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <span style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#10b981', fontWeight: 600 }}>מחובר</span>
            </div>
            <span style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#64748b' }}>🧠 AI פעיל</span>
            <span style={{ fontSize: 'clamp(9px, 2vw, 11px)', color: '#64748b' }}>📊 98.5%</span>
          </div>
          <span style={{ fontSize: 11, color: '#475569' }}>🔒 הקלטה מאובטחת</span>
        </div>
      </div>
    </div>
  );
}

// ─── ISOMETRIC CLASSROOM RENDERER ────────────────────────────────
function drawIsometricClassroom(ctx, width, height, activeStudents, tick, classroom) {
  // Isometric helpers
  const ISO_ANGLE = Math.PI / 6; // 30 degrees
  const SCALE = Math.min(width / 1000, height / 600) * 1.1;
  const originX = width * 0.5;
  const originY = height * 0.18;

  const toIso = (x, y, z = 0) => ({
    x: originX + (x - y) * Math.cos(ISO_ANGLE) * SCALE,
    y: originY + (x + y) * Math.sin(ISO_ANGLE) * SCALE - z * SCALE,
  });

  // Clear
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#0c1222');
  bg.addColorStop(0.5, '#111827');
  bg.addColorStop(1, '#0a0f1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Ambient particles
  for (let i = 0; i < 30; i++) {
    const px = (Math.sin(tick * 0.003 + i * 7.3) * 0.5 + 0.5) * width;
    const py = (Math.cos(tick * 0.002 + i * 4.1) * 0.5 + 0.5) * height;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(99,102,241,${0.08 + Math.sin(tick * 0.01 + i) * 0.04})`;
    ctx.fill();
  }

  // ── FLOOR ──
  const floorSize = 500;
  const fl1 = toIso(0, 0);
  const fl2 = toIso(floorSize, 0);
  const fl3 = toIso(floorSize, floorSize);
  const fl4 = toIso(0, floorSize);

  // Floor shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.moveTo(fl1.x + 8, fl1.y + 8);
  ctx.lineTo(fl2.x + 8, fl2.y + 8);
  ctx.lineTo(fl3.x + 8, fl3.y + 8);
  ctx.lineTo(fl4.x + 8, fl4.y + 8);
  ctx.closePath();
  ctx.fill();

  // Floor base
  const floorGrad = ctx.createLinearGradient(fl1.x, fl1.y, fl3.x, fl3.y);
  floorGrad.addColorStop(0, '#1a2235');
  floorGrad.addColorStop(0.5, '#1e293b');
  floorGrad.addColorStop(1, '#172032');
  ctx.fillStyle = floorGrad;
  ctx.beginPath();
  ctx.moveTo(fl1.x, fl1.y);
  ctx.lineTo(fl2.x, fl2.y);
  ctx.lineTo(fl3.x, fl3.y);
  ctx.lineTo(fl4.x, fl4.y);
  ctx.closePath();
  ctx.fill();

  // Floor grid lines
  ctx.strokeStyle = 'rgba(99,102,241,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const a = toIso(t * floorSize, 0);
    const b = toIso(t * floorSize, floorSize);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const c = toIso(0, t * floorSize);
    const d = toIso(floorSize, t * floorSize);
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
  }

  // Floor border glow
  ctx.strokeStyle = 'rgba(99,102,241,0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(fl1.x, fl1.y);
  ctx.lineTo(fl2.x, fl2.y);
  ctx.lineTo(fl3.x, fl3.y);
  ctx.lineTo(fl4.x, fl4.y);
  ctx.closePath();
  ctx.stroke();

  // ── BACK WALLS ──
  const wallH = 160;

  // Left wall
  const wl1 = toIso(0, 0, wallH);
  const wl2 = toIso(floorSize, 0, wallH);
  const wallGrad1 = ctx.createLinearGradient(fl1.x, fl1.y - wallH * SCALE, fl2.x, fl2.y);
  wallGrad1.addColorStop(0, 'rgba(30,41,59,0.7)');
  wallGrad1.addColorStop(1, 'rgba(15,23,42,0.5)');
  ctx.fillStyle = wallGrad1;
  ctx.beginPath();
  ctx.moveTo(fl1.x, fl1.y); ctx.lineTo(fl2.x, fl2.y);
  ctx.lineTo(wl2.x, wl2.y); ctx.lineTo(wl1.x, wl1.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(99,102,241,0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Right wall
  const wr1 = toIso(floorSize, 0, wallH);
  const wr2 = toIso(floorSize, floorSize, wallH);
  const wallGrad2 = ctx.createLinearGradient(fl2.x, fl2.y - wallH * SCALE, fl3.x, fl3.y);
  wallGrad2.addColorStop(0, 'rgba(20,30,48,0.6)');
  wallGrad2.addColorStop(1, 'rgba(10,15,26,0.4)');
  ctx.fillStyle = wallGrad2;
  ctx.beginPath();
  ctx.moveTo(fl2.x, fl2.y); ctx.lineTo(fl3.x, fl3.y);
  ctx.lineTo(wr2.x, wr2.y); ctx.lineTo(wr1.x, wr1.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(99,102,241,0.08)';
  ctx.stroke();

  // ── WHITEBOARD on back wall ──
  const wbLeft = 100, wbRight = 400, wbBottom = 40, wbTop = 130;
  const wb1 = toIso(wbLeft, 0, wbBottom);
  const wb2 = toIso(wbRight, 0, wbBottom);
  const wb3 = toIso(wbRight, 0, wbTop);
  const wb4 = toIso(wbLeft, 0, wbTop);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.moveTo(wb1.x + 4, wb1.y + 4); ctx.lineTo(wb2.x + 4, wb2.y + 4);
  ctx.lineTo(wb3.x + 4, wb3.y + 4); ctx.lineTo(wb4.x + 4, wb4.y + 4);
  ctx.closePath();
  ctx.fill();

  const wbGrad = ctx.createLinearGradient(wb4.x, wb4.y, wb1.x, wb1.y);
  wbGrad.addColorStop(0, '#e8edf5');
  wbGrad.addColorStop(1, '#d1d8e6');
  ctx.fillStyle = wbGrad;
  ctx.beginPath();
  ctx.moveTo(wb1.x, wb1.y); ctx.lineTo(wb2.x, wb2.y);
  ctx.lineTo(wb3.x, wb3.y); ctx.lineTo(wb4.x, wb4.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Whiteboard text
  const wbCenter = toIso(250, 0, 85);
  ctx.fillStyle = '#475569';
  ctx.font = `bold ${12 * SCALE}px system-ui`;
  ctx.textAlign = 'center';
  ctx.fillText('לוח חכם', wbCenter.x, wbCenter.y);

  // ── DOOR on right wall ──
  const doorBot = 0, doorTop = 120, doorY1 = 80, doorY2 = 150;
  const d1 = toIso(floorSize, doorY1, doorBot);
  const d2 = toIso(floorSize, doorY2, doorBot);
  const d3 = toIso(floorSize, doorY2, doorTop);
  const d4 = toIso(floorSize, doorY1, doorTop);
  ctx.fillStyle = 'rgba(139,92,246,0.15)';
  ctx.beginPath();
  ctx.moveTo(d1.x, d1.y); ctx.lineTo(d2.x, d2.y);
  ctx.lineTo(d3.x, d3.y); ctx.lineTo(d4.x, d4.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(139,92,246,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const doorLabel = toIso(floorSize, 115, 65);
  ctx.fillStyle = '#a78bfa';
  ctx.font = `${10 * SCALE}px system-ui`;
  ctx.textAlign = 'center';
  ctx.fillText('🚪 יציאה', doorLabel.x, doorLabel.y);

  // ── CAMERA SPOTLIGHT ON RED HALF-DESKS ONLY ──
  const laserOrigin = toIso(250, 0, wallH);
  
  // Find each active student's half-desk
  const activeHalves = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const sid1 = row * 12 + col * 2 + 1;
      const sid2 = row * 12 + col * 2 + 2;
      const deskX = 55 + col * 70;
      const deskY = 60 + row * 100;
      const halfW = 55 / 2;
      if (activeStudents.has(sid1)) {
        activeHalves.push({ x: deskX, y: deskY, w: halfW, side: 'left' });
      }
      if (activeStudents.has(sid2)) {
        activeHalves.push({ x: deskX + halfW, y: deskY, w: halfW, side: 'right' });
      }
    }
  }
  
  const isLocked = activeHalves.length > 0;
  
  // Draw spotlight beam on each red half
  activeHalves.forEach(half => {
    const hD = 35;
    const hc1 = toIso(half.x, half.y, 18);
    const hc2 = toIso(half.x + half.w, half.y, 18);
    const hc3 = toIso(half.x + half.w, half.y + hD, 18);
    const hc4 = toIso(half.x, half.y + hD, 18);
    const hCenter = toIso(half.x + half.w / 2, half.y + hD / 2, 18);
    
    // Beam cone from camera to half-desk edges
    ctx.save();
    ctx.globalAlpha = 0.07 + Math.sin(tick * 0.08) * 0.025;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(laserOrigin.x, laserOrigin.y);
    ctx.lineTo(hc4.x - 2, hc4.y + 2);
    ctx.lineTo(hc3.x + 2, hc3.y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Beam edge lines
    ctx.strokeStyle = 'rgba(239,68,68,' + (0.18 + Math.sin(tick * 0.1) * 0.07) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(laserOrigin.x, laserOrigin.y); ctx.lineTo(hc4.x - 2, hc4.y + 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(laserOrigin.x, laserOrigin.y); ctx.lineTo(hc3.x + 2, hc3.y + 2); ctx.stroke();
    
    // Glow on half-desk
    const glowGrad = ctx.createRadialGradient(hCenter.x, hCenter.y, 0, hCenter.x, hCenter.y, 30 * SCALE);
    glowGrad.addColorStop(0, 'rgba(239,68,68,0.14)');
    glowGrad.addColorStop(0.6, 'rgba(239,68,68,0.05)');
    glowGrad.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(hCenter.x, hCenter.y, 30 * SCALE, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  });


  // ── STATIC 3D CAMERA BODY ──
  const camX = 250;
  const camZ = wallH - 5;
  
  // Wall mount bracket
  const bracketTop = toIso(camX, 0, camZ + 12);
  const bracketOut = toIso(camX, 15, camZ + 8);
  ctx.save();
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3 * SCALE;
  ctx.beginPath();
  ctx.moveTo(bracketTop.x, bracketTop.y);
  ctx.lineTo(bracketOut.x, bracketOut.y);
  ctx.stroke();
  // Wall plate
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  const bpT = toIso(camX - 8, 0, camZ + 14);
  const bpB = toIso(camX + 8, 0, camZ + 14);
  const bpC = toIso(camX + 8, 0, camZ);
  const bpD = toIso(camX - 8, 0, camZ);
  ctx.moveTo(bpT.x, bpT.y); ctx.lineTo(bpB.x, bpB.y);
  ctx.lineTo(bpC.x, bpC.y); ctx.lineTo(bpD.x, bpD.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Camera box (STATIC — no rotation)
  const cbW = 18, cbD = 12, cbH = 10;
  const cbY = 18;
  const cbZ2 = camZ + 5;
  
  const cb1 = toIso(camX - cbW, cbY, cbZ2 - cbH);
  const cb2 = toIso(camX + cbW, cbY, cbZ2 - cbH);
  const cb3 = toIso(camX + cbW, cbY + cbD, cbZ2 - cbH);
  const cb4 = toIso(camX - cbW, cbY + cbD, cbZ2 - cbH);
  const ct1 = toIso(camX - cbW, cbY, cbZ2 + cbH);
  const ct2 = toIso(camX + cbW, cbY, cbZ2 + cbH);
  const ct3 = toIso(camX + cbW, cbY + cbD, cbZ2 + cbH);
  const ct4 = toIso(camX - cbW, cbY + cbD, cbZ2 + cbH);
  
  // Bottom
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.moveTo(cb1.x, cb1.y); ctx.lineTo(cb2.x, cb2.y);
  ctx.lineTo(cb3.x, cb3.y); ctx.lineTo(cb4.x, cb4.y);
  ctx.closePath(); ctx.fill();
  // Front
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(cb1.x, cb1.y); ctx.lineTo(cb4.x, cb4.y);
  ctx.lineTo(ct4.x, ct4.y); ctx.lineTo(ct1.x, ct1.y);
  ctx.closePath(); ctx.fill();
  // Right
  ctx.fillStyle = '#162032';
  ctx.beginPath();
  ctx.moveTo(cb4.x, cb4.y); ctx.lineTo(cb3.x, cb3.y);
  ctx.lineTo(ct3.x, ct3.y); ctx.lineTo(ct4.x, ct4.y);
  ctx.closePath(); ctx.fill();
  // Top
  const topGrad2 = ctx.createLinearGradient(ct1.x, ct1.y, ct3.x, ct3.y);
  topGrad2.addColorStop(0, '#334155');
  topGrad2.addColorStop(1, '#1e293b');
  ctx.fillStyle = topGrad2;
  ctx.beginPath();
  ctx.moveTo(ct1.x, ct1.y); ctx.lineTo(ct2.x, ct2.y);
  ctx.lineTo(ct3.x, ct3.y); ctx.lineTo(ct4.x, ct4.y);
  ctx.closePath(); ctx.fill();
  
  // Outlines
  ctx.strokeStyle = 'rgba(16,185,129,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ct1.x, ct1.y); ctx.lineTo(ct2.x, ct2.y);
  ctx.lineTo(ct3.x, ct3.y); ctx.lineTo(ct4.x, ct4.y);
  ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ct1.x, ct1.y); ctx.lineTo(cb1.x, cb1.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ct4.x, ct4.y); ctx.lineTo(cb4.x, cb4.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ct3.x, ct3.y); ctx.lineTo(cb3.x, cb3.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cb1.x, cb1.y); ctx.lineTo(cb4.x, cb4.y); ctx.lineTo(cb3.x, cb3.y); ctx.stroke();

  // ── LENS ──
  const lensPos = toIso(camX, cbY + cbD * 0.5 + 1, cbZ2);
  
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(lensPos.x, lensPos.y, 9 * SCALE, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = isLocked ? '#ef4444' : '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(lensPos.x, lensPos.y, 9 * SCALE, 0, Math.PI * 2); ctx.stroke();
  
  // Lens glass — changes color when locked
  const lensGrad = ctx.createRadialGradient(
    lensPos.x - 2 * SCALE, lensPos.y - 2 * SCALE, 0,
    lensPos.x, lensPos.y, 7 * SCALE
  );
  if (isLocked) {
    lensGrad.addColorStop(0, '#f87171');
    lensGrad.addColorStop(0.4, '#ef4444');
    lensGrad.addColorStop(0.8, '#b91c1c');
    lensGrad.addColorStop(1, '#7f1d1d');
  } else {
    lensGrad.addColorStop(0, '#38bdf8');
    lensGrad.addColorStop(0.4, '#0ea5e9');
    lensGrad.addColorStop(0.8, '#0369a1');
    lensGrad.addColorStop(1, '#0c4a6e');
  }
  ctx.fillStyle = lensGrad;
  ctx.beginPath(); ctx.arc(lensPos.x, lensPos.y, 7 * SCALE, 0, Math.PI * 2); ctx.fill();
  
  ctx.strokeStyle = isLocked ? 'rgba(239,68,68,0.5)' : 'rgba(56,189,248,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(lensPos.x, lensPos.y, 5 * SCALE, 0, Math.PI * 2); ctx.stroke();
  
  ctx.fillStyle = isLocked ? '#7f1d1d' : '#0c4a6e';
  ctx.beginPath(); ctx.arc(lensPos.x, lensPos.y, 3 * SCALE, 0, Math.PI * 2); ctx.fill();
  
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.arc(lensPos.x - 2 * SCALE, lensPos.y - 2 * SCALE, 2 * SCALE, 0, Math.PI * 2); ctx.fill();
  
  // LEDs
  if (Math.floor(tick / 30) % 2 === 0) {
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ct1.x + (ct4.x - ct1.x) * 0.15, ct1.y + (ct4.y - ct1.y) * 0.15 - 3 * SCALE, 2.5 * SCALE, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(ct1.x + (ct4.x - ct1.x) * 0.85, ct1.y + (ct4.y - ct1.y) * 0.85 - 3 * SCALE, 2 * SCALE, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // ── MICROPHONES ──
  const mics = [
    { x: 10, y: 10, label: 'MIC-1' },
    { x: 490, y: 10, label: 'MIC-2' },
    { x: 10, y: 490, label: 'MIC-3' },
    { x: 490, y: 490, label: 'MIC-4' },
    { x: 250, y: 10, label: 'MIC-5' },
    { x: 250, y: 490, label: 'MIC-6' },
  ];
  
  mics.forEach(mic => {
    const mp = toIso(mic.x, mic.y, 0);
    
    // Check if any active student is within range of this mic
    const micRange = 400;
    let isDetecting = false;
    if (activeStudents.size > 0) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 6; col++) {
          const sid1 = row * 12 + col * 2 + 1;
          const sid2 = row * 12 + col * 2 + 2;
          if (activeStudents.has(sid1) || activeStudents.has(sid2)) {
            const sx = 55 + col * 70 + 27.5;
            const sy = 60 + row * 100 + 17.5;
            const dist = Math.hypot(mic.x - sx, mic.y - sy);
            if (dist < micRange) { isDetecting = true; break; }
          }
        }
        if (isDetecting) break;
      }
    }

    const micTop = toIso(mic.x, mic.y, 35);
    const micMid = toIso(mic.x, mic.y, 18);

    // Detection pulse rings
    if (isDetecting) {
      for (let r = 0; r < 3; r++) {
        const pulseR = (10 + r * 8 + Math.sin(tick * 0.06 + r * 1.5) * 3) * SCALE;
        ctx.strokeStyle = `rgba(16,185,129,${0.25 - r * 0.07})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(micTop.x, micTop.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Mic stand — thin pole
    ctx.strokeStyle = isDetecting ? '#6ee7b7' : '#475569';
    ctx.lineWidth = 2.5 * SCALE;
    ctx.beginPath();
    ctx.moveTo(mp.x, mp.y);
    ctx.lineTo(micMid.x, micMid.y);
    ctx.stroke();

    // Mic stand base — small circle on floor
    ctx.fillStyle = isDetecting ? '#065f46' : '#1e293b';
    ctx.beginPath();
    ctx.ellipse(mp.x, mp.y, 6 * SCALE, 3 * SCALE, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isDetecting ? '#10b981' : '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(mp.x, mp.y, 6 * SCALE, 3 * SCALE, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Mic holder arm (angled piece)
    ctx.strokeStyle = isDetecting ? '#6ee7b7' : '#475569';
    ctx.lineWidth = 2 * SCALE;
    ctx.beginPath();
    ctx.moveTo(micMid.x, micMid.y);
    ctx.lineTo(micTop.x + 2 * SCALE, micTop.y + 4 * SCALE);
    ctx.stroke();

    // Mic body — capsule shape
    ctx.save();
    ctx.shadowColor = isDetecting ? '#10b981' : '#6366f1';
    ctx.shadowBlur = isDetecting ? 18 : 6;

    // Mic body (rounded rectangle approximation)
    const mw = 6 * SCALE;
    const mh = 12 * SCALE;
    const mcx = micTop.x;
    const mcy = micTop.y;

    // Outer capsule
    ctx.fillStyle = isDetecting ? '#1e293b' : '#1e293b';
    ctx.beginPath();
    ctx.arc(mcx, mcy - mh * 0.3, mw, Math.PI, 0); // top dome
    ctx.arc(mcx, mcy + mh * 0.15, mw, 0, Math.PI); // bottom dome
    ctx.closePath();
    ctx.fill();

    // Mic grille (horizontal lines)
    ctx.strokeStyle = isDetecting ? '#10b981' : '#6366f1';
    ctx.lineWidth = 0.8;
    for (let i = -3; i <= 3; i++) {
      const ly = mcy - mh * 0.1 + i * 2.2 * SCALE;
      const lw = mw * (1 - Math.abs(i) * 0.12);
      ctx.beginPath();
      ctx.moveTo(mcx - lw, ly);
      ctx.lineTo(mcx + lw, ly);
      ctx.stroke();
    }

    // Mic ring (colored band)
    ctx.strokeStyle = isDetecting ? '#10b981' : '#6366f1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mcx, mcy + mh * 0.15, mw, 0, Math.PI);
    ctx.stroke();

    // Top highlight
    ctx.fillStyle = isDetecting ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.2)';
    ctx.beginPath();
    ctx.arc(mcx, mcy - mh * 0.3, mw * 0.6, Math.PI, 0);
    ctx.fill();

    ctx.restore();

    // Label
    ctx.fillStyle = isDetecting ? '#10b981' : '#475569';
    ctx.font = `bold ${7 * SCALE}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(mic.label, mp.x, mp.y + 14 * SCALE);
    
    // Detection indicator text
    if (isDetecting) {
      ctx.fillStyle = '#10b981';
      ctx.font = `bold ${6 * SCALE}px monospace`;
      ctx.fillText('● ACTIVE', mp.x, mp.y + 22 * SCALE);
    }
  });

  // ── DESKS & STUDENTS ──
  // Draw from back to front for proper z-ordering
  const rows = 4, cols = 6;
  const deskW = 55, deskD = 35, deskH = 18;
  const startX = 55, startY = 60;
  const spacingX = 70, spacingY = 100;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dx = startX + col * spacingX;
      const dy = startY + row * spacingY;
      const studentId1 = row * 12 + col * 2 + 1;
      const studentId2 = row * 12 + col * 2 + 2;
      const isActive1 = activeStudents.has(studentId1);
      const isActive2 = activeStudents.has(studentId2);

      const halfW = deskW / 2;

      // ── LEFT HALF (Student 1) ──
      const color1 = isActive1 ? '#ef4444' : '#64748b';
      const colorTop1 = isActive1 ? '#f87171' : '#3d4f65';
      const colorFront1 = isActive1 ? '#dc2626' : '#2a3548';
      const colorSide1 = isActive1 ? '#b91c1c' : '#243044';

      // ── RIGHT HALF (Student 2) ──
      const color2 = isActive2 ? '#ef4444' : '#64748b';
      const colorTop2 = isActive2 ? '#f87171' : '#3d4f65';
      const colorFront2 = isActive2 ? '#dc2626' : '#2a3548';
      const colorSide2 = isActive2 ? '#b91c1c' : '#243044';

      // Desk shadow
      const ds1 = toIso(dx + 3, dy + 3, 0);
      const ds2 = toIso(dx + deskW + 3, dy + 3, 0);
      const ds3 = toIso(dx + deskW + 3, dy + deskD + 3, 0);
      const ds4 = toIso(dx + 3, dy + deskD + 3, 0);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.moveTo(ds1.x, ds1.y); ctx.lineTo(ds2.x, ds2.y);
      ctx.lineTo(ds3.x, ds3.y); ctx.lineTo(ds4.x, ds4.y);
      ctx.closePath();
      ctx.fill();

      // ── TABLE LEGS ──
      const legW = 3;
      const legInset = 3;
      const legDark = '#1a2536';
      const legLight = '#243044';
      const legH = deskH - 3; // legs go up to just under tabletop

      const legs = [
        { x: dx + legInset, y: dy + legInset },
        { x: dx + deskW - legInset - legW, y: dy + legInset },
        { x: dx + legInset, y: dy + deskD - legInset - legW },
        { x: dx + deskW - legInset - legW, y: dy + deskD - legInset - legW },
      ];

      // Draw back legs first, then front for proper z-order
      [2, 3, 0, 1].forEach(li => {
        const leg = legs[li];
        // Left visible face
        const a1 = toIso(leg.x, leg.y + legW, 0);
        const a2 = toIso(leg.x, leg.y + legW, legH);
        const a3 = toIso(leg.x, leg.y, legH);
        const a4 = toIso(leg.x, leg.y, 0);
        ctx.fillStyle = legDark;
        ctx.beginPath();
        ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y);
        ctx.lineTo(a3.x, a3.y); ctx.lineTo(a4.x, a4.y);
        ctx.closePath();
        ctx.fill();

        // Right visible face
        const b1 = toIso(leg.x, leg.y + legW, 0);
        const b2 = toIso(leg.x, leg.y + legW, legH);
        const b3 = toIso(leg.x + legW, leg.y + legW, legH);
        const b4 = toIso(leg.x + legW, leg.y + legW, 0);
        ctx.fillStyle = legLight;
        ctx.beginPath();
        ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y);
        ctx.lineTo(b3.x, b3.y); ctx.lineTo(b4.x, b4.y);
        ctx.closePath();
        ctx.fill();
      });

      // Active glow under desk
      if (isActive1 || isActive2) {
        const glowCenter = toIso(dx + deskW / 2, dy + deskD / 2, 0);
        const pulseR = (25 + Math.sin(tick * 0.1) * 5) * SCALE;
        const glow = ctx.createRadialGradient(glowCenter.x, glowCenter.y, 0, glowCenter.x, glowCenter.y, pulseR);
        glow.addColorStop(0, 'rgba(239,68,68,0.2)');
        glow.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(glowCenter.x, glowCenter.y, pulseR, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── THIN TABLETOP ──
      const topThick = 3; // thin slab
      const tabBot = deskH - topThick;

      // Tabletop front face (left half)
      const tfl1 = toIso(dx, dy + deskD, tabBot);
      const tfl2 = toIso(dx + halfW, dy + deskD, tabBot);
      const tfl3 = toIso(dx + halfW, dy + deskD, deskH);
      const tfl4 = toIso(dx, dy + deskD, deskH);
      ctx.fillStyle = colorFront1;
      ctx.beginPath();
      ctx.moveTo(tfl1.x, tfl1.y); ctx.lineTo(tfl2.x, tfl2.y);
      ctx.lineTo(tfl3.x, tfl3.y); ctx.lineTo(tfl4.x, tfl4.y);
      ctx.closePath();
      ctx.fill();

      // Tabletop front face (right half)
      const tfr1 = toIso(dx + halfW, dy + deskD, tabBot);
      const tfr2 = toIso(dx + deskW, dy + deskD, tabBot);
      const tfr3 = toIso(dx + deskW, dy + deskD, deskH);
      const tfr4 = toIso(dx + halfW, dy + deskD, deskH);
      ctx.fillStyle = colorFront2;
      ctx.beginPath();
      ctx.moveTo(tfr1.x, tfr1.y); ctx.lineTo(tfr2.x, tfr2.y);
      ctx.lineTo(tfr3.x, tfr3.y); ctx.lineTo(tfr4.x, tfr4.y);
      ctx.closePath();
      ctx.fill();

      // Tabletop right side face
      const tsr1 = toIso(dx + deskW, dy, tabBot);
      const tsr2 = toIso(dx + deskW, dy + deskD, tabBot);
      const tsr3 = toIso(dx + deskW, dy + deskD, deskH);
      const tsr4 = toIso(dx + deskW, dy, deskH);
      ctx.fillStyle = colorSide2;
      ctx.beginPath();
      ctx.moveTo(tsr1.x, tsr1.y); ctx.lineTo(tsr2.x, tsr2.y);
      ctx.lineTo(tsr3.x, tsr3.y); ctx.lineTo(tsr4.x, tsr4.y);
      ctx.closePath();
      ctx.fill();

      // ── LEFT HALF: top face ──
      const lt1 = toIso(dx, dy, deskH);
      const lt2 = toIso(dx + halfW, dy, deskH);
      const lt3 = toIso(dx + halfW, dy + deskD, deskH);
      const lt4 = toIso(dx, dy + deskD, deskH);

      ctx.save();
      if (isActive1) { ctx.shadowColor = color1; ctx.shadowBlur = 12; }
      ctx.fillStyle = colorTop1;
      ctx.beginPath();
      ctx.moveTo(lt1.x, lt1.y); ctx.lineTo(lt2.x, lt2.y);
      ctx.lineTo(lt3.x, lt3.y); ctx.lineTo(lt4.x, lt4.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ── RIGHT HALF: top face ──
      const rt1 = toIso(dx + halfW, dy, deskH);
      const rt2 = toIso(dx + deskW, dy, deskH);
      const rt3 = toIso(dx + deskW, dy + deskD, deskH);
      const rt4 = toIso(dx + halfW, dy + deskD, deskH);

      ctx.save();
      if (isActive2) { ctx.shadowColor = color2; ctx.shadowBlur = 12; }
      ctx.fillStyle = colorTop2;
      ctx.beginPath();
      ctx.moveTo(rt1.x, rt1.y); ctx.lineTo(rt2.x, rt2.y);
      ctx.lineTo(rt3.x, rt3.y); ctx.lineTo(rt4.x, rt4.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ── Divider line between halves ──
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lt2.x, lt2.y); ctx.lineTo(lt3.x, lt3.y);
      ctx.stroke();

      // ── Desk outline ──
      const dt1 = toIso(dx, dy, deskH);
      const dt2 = toIso(dx + deskW, dy, deskH);
      const dt3 = toIso(dx + deskW, dy + deskD, deskH);
      const dt4 = toIso(dx, dy + deskD, deskH);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(dt1.x, dt1.y); ctx.lineTo(dt2.x, dt2.y);
      ctx.lineTo(dt3.x, dt3.y); ctx.lineTo(dt4.x, dt4.y);
      ctx.closePath();
      ctx.stroke();
    }
  }

  // ── CAMERA LABEL ──
  const camLabelPos = toIso(250, 0, wallH + 12);
  ctx.fillStyle = '#10b981';
  ctx.font = `bold ${8 * SCALE}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('📹 AI CAMERA', camLabelPos.x, camLabelPos.y);

  // ── TOP-LEFT HUD ──
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(12, 12, 200, 50);
  ctx.strokeStyle = 'rgba(99,102,241,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(12, 12, 200, 50);
  ctx.fillStyle = '#a5b4fc';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`EDUGUARD AI • ${classroom.name}`, 20, 30);
  ctx.fillStyle = '#64748b';
  ctx.font = '10px monospace';
  const now = new Date();
  ctx.fillText(`${now.toLocaleTimeString('he-IL')} • LIVE`, 20, 48);
  if (Math.floor(tick / 30) % 2 === 0) {
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(195, 22, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── BOTTOM-RIGHT STATUS ──
  const statusText = activeStudents.size === 0 ? '✅ STATUS: QUIET' : `⚠️ ALERT: ${activeStudents.size} TALKING`;
  const statusColor = activeStudents.size === 0 ? '#10b981' : '#ef4444';
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(width - 220, height - 42, 208, 30);
  ctx.strokeStyle = statusColor + '40';
  ctx.lineWidth = 1;
  ctx.strokeRect(width - 220, height - 42, 208, 30);
  ctx.fillStyle = statusColor;
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(statusText, width - 22, height - 22);
}

function drawIsometricStudent(ctx, toIso, x, y, isActive, id, tick, SCALE) {
  // Not used anymore — handled directly in desk drawing
}

// ─── MAIN APP ────────────────────────────────────────────────────
export default function ClassroomMonitoringSystem() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [events, setEvents] = useState([]);
  const [toast, setToast] = useState(null);
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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ensure viewport meta tag for mobile
  useEffect(() => {
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(meta);
    }
    // Global mobile styles
    const style = document.createElement('style');
    style.textContent = `
      * { -webkit-tap-highlight-color: transparent; }
      html, body { overflow-x: hidden; max-width: 100vw; }
      body { -webkit-text-size-adjust: 100%; }
      input, button, select, textarea { font-size: 16px; }
      @media (max-width: 480px) {
        input, button, select, textarea { font-size: 16px !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setTimeout(() => setFadeIn(true), 50);
  };

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
    if (!isLoggedIn) return;
    const updateInterval = setInterval(() => {
      setClassrooms(prev => {
        const now = Date.now();
        const ref = activeClassRef.current;
        const elapsed = now - ref.since;
        const shouldRotate = ref.ids.length === 0 || elapsed > (10000 + Math.random() * 8000);

        if (shouldRotate) {
          const twoClassrooms = Math.random() < 0.25;
          const id1 = pickRandomClassroom(prev, []);
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
  }, [isLoggedIn]);

  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;

  const formatTime = d => d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = d => d.toLocaleDateString('he-IL', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

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

  // ════════════════════════════════════════════════════════
  // ROUTE: HOME PAGE
  // ════════════════════════════════════════════════════════
  if (currentPage === 'home') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: '#fff', direction: 'rtl',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'clamp(16px, 4vw, 24px)', position: 'relative', overflow: 'hidden',
        opacity: fadeIn ? 1 : 0, transition: 'opacity 0.6s ease',
      }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%', width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%', width: '60vw', height: '60vw',
          background: 'radial-gradient(circle, rgba(14,165,233,0.04) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          width: 'clamp(72px, 16vw, 100px)', height: 'clamp(72px, 16vw, 100px)', borderRadius: 'clamp(20px, 5vw, 28px)', marginBottom: 'clamp(16px, 4vw, 24px)',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(14,165,233,0.08))',
          border: '1px solid rgba(99,102,241,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 48px rgba(99,102,241,0.2)',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <img src={process.env.PUBLIC_URL + '/Logo.png'} alt="CatCheat"
            style={{ width: '70%', height: '70%', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="font-size:44px">🛡️</span>'; }}
          />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(32px, 8vw, 56px)', fontWeight: 900, margin: '0 0 8px',
          background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #7dd3fc 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px', textAlign: 'center',
        }}>CatCheat</h1>

        <p style={{
          fontSize: 'clamp(12px, 3vw, 15px)', color: '#64748b', margin: '0 0 8px', textAlign: 'center',
          maxWidth: 400, lineHeight: 1.6, padding: '0 10px',
        }}>מערכת ניטור חכמה למניעת העתקות במבחנים</p>

        <div style={{
          fontSize: 'clamp(9px, 2vw, 11px)', color: '#475569', marginBottom: 'clamp(24px, 6vw, 40px)', textAlign: 'center',
          padding: '6px 16px', borderRadius: 20,
          background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)',
        }}>
          AI-Powered Exam Monitoring System
        </div>

        {/* Two main buttons */}
        <div style={{ display: 'flex', gap: 'clamp(12px, 3vw, 20px)', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 600, width: '100%', padding: '0 4px' }}>
          {/* Create Event */}
          <button onClick={() => setCurrentPage('teacher')} style={{
            flex: '1 1 min(100%, 240px)', maxWidth: 280, padding: 'clamp(20px, 5vw, 32px) clamp(16px, 3vw, 24px)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 20, cursor: 'pointer', transition: 'all 0.3s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(99,102,241,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: 'clamp(44px, 10vw, 60px)', height: 'clamp(44px, 10vw, 60px)', borderRadius: 'clamp(12px, 2.5vw, 16px)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(20px, 5vw, 28px)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            }}>📝</div>
            <div style={{ fontSize: 'clamp(14px, 3.5vw, 17px)', fontWeight: 700, color: '#e2e8f0' }}>צור אירוע מבחן חדש</div>
            <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: '#64748b', lineHeight: 1.5 }}>
              הגדר כיתות, בדוק נוכחות, וסדר מושבים אקראיים
            </div>
          </button>

          {/* Scheduled Events */}
          <button onClick={() => setCurrentPage('events')} style={{
            flex: '1 1 min(100%, 240px)', maxWidth: 280, padding: 'clamp(20px, 5vw, 32px) clamp(16px, 3vw, 24px)',
            background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(6,182,212,0.05))',
            border: '1px solid rgba(14,165,233,0.15)',
            borderRadius: 20, cursor: 'pointer', transition: 'all 0.3s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center',
            position: 'relative',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.4)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(14,165,233,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.15)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {events.length > 0 && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                width: 24, height: 24, borderRadius: '50%',
                background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: '#fff',
                boxShadow: '0 4px 12px rgba(14,165,233,0.4)',
              }}>{events.length}</div>
            )}
            <div style={{
              width: 'clamp(44px, 10vw, 60px)', height: 'clamp(44px, 10vw, 60px)', borderRadius: 'clamp(12px, 2.5vw, 16px)',
              background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'clamp(20px, 5vw, 28px)', boxShadow: '0 8px 24px rgba(14,165,233,0.3)',
            }}>📋</div>
            <div style={{ fontSize: 'clamp(14px, 3.5vw, 17px)', fontWeight: 700, color: '#e2e8f0' }}>אירועים מתוכננים</div>
            <div style={{ fontSize: 'clamp(10px, 2vw, 11px)', color: '#64748b', lineHeight: 1.5 }}>
              צפה באירועים שנוצרו והתחל מבחנים בלחיצה
            </div>
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 'clamp(24px, 6vw, 48px)', fontSize: 'clamp(9px, 1.8vw, 10px)', color: '#334155', textAlign: 'center' }}>
          CatCheat v2.1 • Powered by AI • © {new Date().getFullYear()}
        </div>

        {/* Success Toast */}
        {toast && (
          <div style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 28px)', borderRadius: 12,
            width: 'max-content', maxWidth: 'calc(100vw - 32px)',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
            color: '#fff', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'slideDown 0.4s ease',
          }}>
            <span style={{ fontSize: 20 }}>✅</span>
            {toast}
          </div>
        )}

        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ROUTE: TEACHER CONTROL (Create Event)
  // ════════════════════════════════════════════════════════
  if (currentPage === 'teacher') {
    return (
      <div style={{ opacity: fadeIn ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <TeacherControl classrooms={classrooms} onBack={() => setCurrentPage('home')} onCreateEvent={(eventData) => {
          setEvents(prev => [...prev, {
            id: Date.now(),
            seatMaps: eventData.seatMaps,
            classrooms: eventData.classrooms,
            totalStudents: eventData.classrooms.reduce((sum, c) => sum + c.studentCount, 0),
            createdAt: new Date(),
            status: 'scheduled',
          }]);
          setCurrentPage('home');
          setToast('האירוע נוצר בהצלחה! 🎉');
          setTimeout(() => setToast(null), 3500);
        }} />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ROUTE: EVENTS PAGE
  // ════════════════════════════════════════════════════════
  if (currentPage === 'events') {
    return (
      <EventsPage
        events={events}
        setEvents={setEvents}
        classrooms={classrooms}
        onBack={() => setCurrentPage('home')}
        onCreateNew={() => setCurrentPage('teacher')}
        onStartExam={(event) => {
          setEvents(prev => prev.map(e => e.id === event.id ? { ...e, status: 'active' } : e));
          setSelectedClass(null);
          setCurrentPage('dashboard');
        }}
        fadeIn={fadeIn}
      />
    );
  }

  // ════════════════════════════════════════════════════════
  // ROUTE: CLASSROOM DETAIL VIEW
  // ════════════════════════════════════════════════════════
  if (selectedClass) {
    return (
      <div style={{ opacity: fadeIn ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <ClassroomDetail classroom={selectedClass} onBack={() => setSelectedClass(null)} />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ROUTE: DASHBOARD (Live Monitoring)
  // ════════════════════════════════════════════════════════
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#fff', padding: 'clamp(12px, 3vw, 24px)', direction: 'rtl',
      opacity: fadeIn ? 1 : 0, transition: 'opacity 0.6s ease',
    }} className="main-container">

      {/* Demo Mode Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15), rgba(99,102,241,0.15))',
        border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12,
        padding: '8px 20px', marginBottom: 16, textAlign: 'center',
        fontSize: 'clamp(9px, 2vw, 12px)', color: '#a5b4fc', fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        textAlign: 'center', flexWrap: 'wrap',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: '#a5b4fc',
          animation: 'pulse 2s infinite',
        }} />
        מצב הדגמה — נתונים מדומים בזמן אמת | Demo Mode — Live Simulated Data
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 'clamp(12px, 3vw, 24px)', paddingBottom: 'clamp(12px, 3vw, 24px)',
        borderBottom: '1px solid rgba(99,102,241,0.15)',
        flexWrap: 'wrap', gap: 10,
      }} className="main-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 16px)' }} className="header-left">
          <button onClick={() => { setCurrentPage('home'); setSelectedClass(null); }} style={{
            padding: 'clamp(6px, 1.2vw, 8px) clamp(8px, 1.5vw, 14px)', background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8,
            color: '#a5b4fc', fontSize: 'clamp(9px, 2vw, 11px)', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          }}>🏠 ראשי</button>
          <div style={{
            width: 'clamp(36px, 6vw, 60px)', height: 'clamp(36px, 6vw, 60px)',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)', overflow: 'hidden',
          }} className="logo-box">
            <img src={process.env.PUBLIC_URL + '/Logo.png'} alt="CatCheat"
              style={{ width: '70%', height: '70%', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <h1 style={{
              fontSize: 'clamp(18px, 3vw, 28px)', fontWeight: 800, margin: 0,
              background: 'linear-gradient(90deg, #fff, #a5b4fc)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }} className="logo-title">CatCheat</h1>
            <p style={{ fontSize: 'clamp(9px, 1.8vw, 12px)', color: '#64748b', margin: 0 }} className="logo-sub">
              מערכת ניטור חכמה למניעת העתקות
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 1.5vw, 16px)', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {/* System Health */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1vw, 12px)', padding: 'clamp(6px, 1.2vw, 10px) clamp(8px, 1.5vw, 16px)',
            background: 'rgba(16,185,129,0.08)', borderRadius: 10,
            border: '1px solid rgba(16,185,129,0.15)',
          }} className="health-badge">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span style={{ fontSize: 'clamp(9px, 1.8vw, 11px)', color: '#10b981', fontWeight: 600 }}>תקינה</span>
            </div>
            <span style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: '#475569' }}>|</span>
            <span style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: '#64748b' }}>8 מצלמות</span>
            <span style={{ fontSize: 'clamp(8px, 1.5vw, 10px)', color: '#64748b' }}>48 מיקרופונים</span>
          </div>

          <div style={{
            textAlign: 'right', padding: 'clamp(6px, 1.5vw, 12px) clamp(10px, 2vw, 20px)',
            background: 'rgba(99,102,241,0.1)', borderRadius: 10,
            border: '1px solid rgba(99,102,241,0.15)',
          }} className="clock-box">
            <div style={{
              fontSize: 'clamp(16px, 3vw, 24px)', fontWeight: 700, fontFamily: 'monospace',
              background: 'linear-gradient(90deg, #fff, #c7d2fe)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }} className="clock-time">{formatTime(currentTime)}</div>
            <div style={{ fontSize: 'clamp(8px, 1.5vw, 11px)', color: '#64748b' }} className="clock-date">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: 'clamp(6px, 1.5vw, 16px)', marginBottom: 'clamp(12px, 2.5vw, 20px)', flexWrap: 'wrap' }} className="stats-bar">
        {[
          { icon: '🏫', value: classrooms.length, label: 'סה"כ כיתות', color: '#6366f1' },
          { icon: '👥', value: totalStudents, label: 'סה"כ תלמידים', color: '#3b82f6' },
          { icon: '🚨', value: totalAlerts, label: 'התראות היום', color: '#ef4444' },
          { icon: '⚠️', value: activeClasses, label: 'כיתות עם פעילות', color: '#f59e0b' },
          { icon: '✅', value: classrooms.filter(c => c.status === 'green').length, label: 'כיתות שקטות', color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} style={{
            flex: 1, padding: 20,
            background: 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.7))',
            borderRadius: 16, border: '1px solid rgba(99,102,241,0.1)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }} className="stat-card">
            <span style={{ fontSize: 24 }} className="stat-icon">{stat.icon}</span>
            <span style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 800, fontFamily: 'monospace', color: stat.color }} className="stat-value">{stat.value}</span>
            <span style={{ fontSize: 11, color: '#64748b' }} className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Status Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 24, padding: '14px 20px',
        background: 'rgba(30,41,59,0.5)', borderRadius: 12, marginBottom: 24,
      }} className="legend-bar">
        <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>מקרא סטטוס:</span>
        {[
          { color: '#10b981', label: 'שקט — לא זוהו דיבורים' },
          { color: '#f59e0b', label: 'אזהרה — חלק מהתלמידים מדברים' },
          { color: '#ef4444', label: 'התראה — מספר תלמידים מדברים' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Classrooms Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
        gap: 'clamp(12px, 2vw, 20px)',
      }} className="classrooms-grid">
        {classrooms.map(classroom => {
          const statusInfo = getStatusColor(classroom.status);
          return (
            <div key={classroom.id} style={{
              background: 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.8))',
              borderRadius: 16, padding: '18px 20px', border: '2px solid',
              borderColor: statusInfo.bg, cursor: 'pointer', transition: 'all 0.3s ease',
              position: 'relative', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', gap: 12,
              boxShadow: `0 4px 20px ${statusInfo.glow}`,
            }} className="class-card" onClick={() => setSelectedClass(classroom)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0 }} className="card-class-name">{classroom.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {classroom.status === 'red' && (
                    <span style={{
                      padding: '3px 7px', background: 'rgba(239,68,68,0.2)',
                      border: '1px solid rgba(239,68,68,0.5)', borderRadius: 6,
                      fontSize: 9, fontWeight: 600, color: '#ef4444', whiteSpace: 'nowrap',
                    }} className="alert-tag">⚠️ נדרשת בדיקה</span>
                  )}
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                    background: statusInfo.bg, boxShadow: `0 0 12px ${statusInfo.glow}`,
                  }} className="status-dot-wrap">
                    <span className={classroom.status !== 'green' ? 'pulse' : ''}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'inherit', display: 'block' }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }} className="card-info-row">
                <span>📚 {classroom.subject}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="card-status-row">
                <span style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: `${statusInfo.bg}20`, color: statusInfo.bg,
                }} className="card-status-badge">{statusInfo.text}</span>
                <span style={{ fontSize: 12, color: '#64748b' }} className="card-students">👥 {classroom.students} תלמידים</span>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', padding: '10px 0',
                borderTop: '1px solid rgba(99,102,241,0.1)',
                borderBottom: '1px solid rgba(99,102,241,0.1)',
              }} className="card-stats-row">
                <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: classroom.talkingCount > 0 ? '#ef4444' : '#10b981' }} className="card-stat-num">{classroom.talkingCount}</span>
                  <span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }} className="card-stat-label">מדברים</span>
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(99,102,241,0.15)' }} className="card-stat-divider" />
                <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: '#f59e0b' }} className="card-stat-num">{classroom.alerts}</span>
                  <span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }} className="card-stat-label">התראות</span>
                </div>
                <div style={{ width: 1, height: 28, background: 'rgba(99,102,241,0.15)' }} className="card-stat-divider" />
                <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: '#e2e8f0' }} className="card-stat-num">{classroom.lastAlert || '—'}</span>
                  <span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }} className="card-stat-label">אחרונה</span>
                </div>
              </div>

              <button style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }} className="view-btn">
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

        .detail-sidebar::-webkit-scrollbar { width: 4px; }
        .detail-sidebar::-webkit-scrollbar-track { background: transparent; }
        .detail-sidebar::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.15); border-radius: 4px; }
        .detail-sidebar::-webkit-scrollbar-thumb:hover { background: rgba(56,189,248,0.3); }
        .detail-sidebar { scrollbar-width: thin; scrollbar-color: rgba(56,189,248,0.15) transparent; }

        @media (max-width: 480px) {
          .main-container { padding: 8px !important; }
          .main-header { flex-direction: column !important; gap: 8px !important; padding-bottom: 10px !important; margin-bottom: 10px !important; }
          .header-left { gap: 10px !important; }
          .logo-box { width: 36px !important; height: 36px !important; border-radius: 8px !important; }
          .logo-title { font-size: 16px !important; }
          .logo-sub { font-size: 8px !important; }
          .health-badge { display: none !important; }
          .clock-box { padding: 6px 10px !important; width: 100% !important; text-align: center !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 12px !important; }
          .clock-time { font-size: 16px !important; }
          .clock-date { font-size: 9px !important; }

          .stats-bar { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 6px !important; margin-bottom: 8px !important; }
          .stat-card { padding: 8px 4px !important; border-radius: 8px !important; gap: 2px !important; }
          .stat-icon { font-size: 14px !important; }
          .stat-value { font-size: 16px !important; }
          .stat-label { font-size: 7px !important; }
          .legend-bar { display: none !important; }
          .classrooms-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .class-card { padding: 10px !important; border-radius: 10px !important; gap: 6px !important; border-width: 1.5px !important; }
          .card-class-name { font-size: 13px !important; }
          .card-info-row { font-size: 10px !important; }
          .card-status-row { flex-wrap: wrap !important; gap: 4px !important; }
          .card-status-badge { font-size: 9px !important; padding: 2px 8px !important; }
          .card-students { font-size: 9px !important; }
          .card-stats-row { padding: 6px 0 !important; }
          .card-stat-num { font-size: 14px !important; }
          .card-stat-label { font-size: 7px !important; }
          .card-stat-divider { height: 20px !important; }
          .view-btn { padding: 8px 10px !important; font-size: 10px !important; border-radius: 8px !important; }
          .alert-tag { font-size: 7px !important; padding: 2px 4px !important; }
          .status-dot-wrap { width: 10px !important; height: 10px !important; }
        }

        @media (min-width: 481px) and (max-width: 600px) {
          .main-container { padding: 10px !important; }
          .main-header { flex-direction: column !important; gap: 10px !important; }
          .health-badge { display: none !important; }
          .logo-title { font-size: 20px !important; }
          .stats-bar { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
          .stat-card { padding: 10px 6px !important; }
          .stat-value { font-size: 18px !important; }
          .stat-label { font-size: 8px !important; }
          .legend-bar { display: none !important; }
          .classrooms-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
          .class-card { padding: 12px !important; gap: 8px !important; }
          .card-class-name { font-size: 15px !important; }
          .view-btn { padding: 9px 12px !important; font-size: 11px !important; }
        }

        @media (min-width: 601px) and (max-width: 900px) {
          .main-container { padding: 16px !important; }
          .stats-bar { display: flex !important; flex-wrap: wrap !important; gap: 10px !important; }
          .stat-card { min-width: calc(33% - 10px) !important; flex: 1 1 calc(33% - 10px) !important; }
          .legend-bar { flex-wrap: wrap !important; gap: 12px !important; }
          .classrooms-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 14px !important; }
        }

        @media (min-width: 901px) and (max-width: 1200px) {
          .classrooms-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }

        @media (min-width: 1201px) {
          .classrooms-grid { grid-template-columns: repeat(4, 1fr) !important; }
        }

        @media (max-width: 768px) {
          .detail-container { flex-direction: column !important; overflow-x: hidden !important; }
          .detail-sidebar { width: 100% !important; min-width: 0 !important; flex-shrink: 0 !important; border-left: none !important; border-bottom: 1px solid rgba(99,102,241,0.15) !important; max-height: none !important; overflow: visible !important; overflow-x: hidden !important; padding: 14px !important; }
          .detail-main { padding: 10px !important; min-width: 0 !important; overflow-x: hidden !important; }
          .detail-header { flex-direction: column !important; gap: 8px !important; }
          .detail-page-title { font-size: 14px !important; }
          .detail-canvas-box { padding: 6px !important; border-radius: 12px !important; overflow: hidden !important; }
          .detail-canvas-box canvas { max-width: 100% !important; height: auto !important; }
          .detail-bottom-bar { flex-wrap: wrap !important; gap: 6px !important; }
          .detail-bottom-bar > div { min-width: calc(50% - 6px) !important; font-size: 9px !important; padding: 8px !important; }
          .camera-info { flex-direction: column !important; gap: 4px !important; font-size: 9px !important; }
        }
        @media (max-width: 360px) {
          .main-container { padding: 6px !important; }
          .classrooms-grid { grid-template-columns: 1fr !important; gap: 6px !important; }
          .stats-bar { grid-template-columns: repeat(2, 1fr) !important; }
          .class-card { padding: 8px !important; }
          .card-class-name { font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}

// ─── CLASSROOM DETAIL VIEW (with Isometric Canvas) ───────────────
function ClassroomDetail({ classroom, onBack }) {
  const [notifications, setNotifications] = useState([
    { id: 1, time: new Date(), type: 'system', icon: '🟢', message: 'ניטור AI הופעל עבור ' + classroom.name, videoKey: null },
    { id: 2, time: new Date(), type: 'info', icon: '📹', message: 'מצלמה מחוברת — איכות HD', videoKey: null },
    { id: 3, time: new Date(), type: 'info', icon: '🎤', message: 'כל 6 המיקרופונים מכוילים ופעילים', videoKey: null },
  ]);

  const [currentStatus, setCurrentStatus] = useState('green');
  const [talkingCount, setTalkingCount] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [activeVideo, setActiveVideo] = useState(null);
  const [showCameraFeed, setShowCameraFeed] = useState(false);
  const [activityHistory, setActivityHistory] = useState(() => Array.from({ length: 20 }, () => 0));
  
  // Smart discipline scoring system
  const scoreRef = useRef({
    score: Math.round(classroom.discipline * 100),
    peakTalking: 0,
    quietStreak: 0,
    talkStreak: 0,
    lastTalkingCount: 0,
    trend: 0,
    trendSamples: [],
  });
  const [disciplineScore, setDisciplineScore] = useState(Math.round(classroom.discipline * 100));
  const [scoreTrend, setScoreTrend] = useState(0);

  const canvasRef = useRef(null);
  const cameraFeedRef = useRef(null);
  const animationRef = useRef(null);
  const stateRef = useRef({
    tick: 0,
    activeStudents: new Set(),
    lastNoiseTime: 0,
    lastCheatTime: 0,
    particles: [],
  });

  const allStudents = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      allStudents.push({ id: row * 12 + col * 2 + 1, row, col, seat: 0 });
      allStudents.push({ id: row * 12 + col * 2 + 2, row, col, seat: 1 });
    }
  }

  const addNotification = useCallback((type, icon, message, videoKey = null) => {
    setNotifications(prev => [{
      id: Date.now(), time: new Date(), type, icon, message, videoKey,
    }, ...prev].slice(0, 50));
  }, []);

  const findNearestMic = (studentId) => {
    const mics = ['MIC-1', 'MIC-2', 'MIC-3', 'MIC-4', 'MIC-5', 'MIC-6'];
    return mics[studentId % mics.length];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const animate = (timestamp) => {
      const state = stateRef.current;
      state.tick++;

      // Generate talking students
      if (timestamp - state.lastNoiseTime > 10000) {
        if (Math.random() < 0.15) {
          state.lastNoiseTime = timestamp;
          const student = allStudents[Math.floor(Math.random() * allStudents.length)];
          state.activeStudents.add(student.id);
          const mic = findNearestMic(student.id);
          const confidence = (85 + Math.random() * 14).toFixed(0);
          addNotification('alert', '🚨', `התראה: זוהה תלמיד מדבר ליד ${mic} — רמת ודאות: ${confidence}%`, null);
          setTotalAlerts(prev => prev + 1);
          setTimeout(() => { state.activeStudents.delete(student.id); }, 5000);
        }
      }

      // Generate cheating alerts
      if (timestamp - state.lastCheatTime > 15000) {
        if (Math.random() < 0.1) {
          state.lastCheatTime = timestamp;
          const student = allStudents[Math.floor(Math.random() * allStudents.length)];
          const studentRow = Math.floor((student.id - 1) / 12) + 1;
          const studentSeat = ((student.id - 1) % 12) + 1;
          const confidence = (75 + Math.random() * 20).toFixed(0);
          const cheatTypes = [
            { icon: '👀', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) מציץ לשכן — רמת ודאות: ${confidence}%`, videoKey: 'peeking' },
            { icon: '📱', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) זוהה שימוש בטלפון — רמת ודאות: ${confidence}%`, videoKey: 'phone_usage' },
            { icon: '📝', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) זוהה העברת פתקים — רמת ודאות: ${confidence}%`, videoKey: 'passing_notes' },
            { icon: '🤚', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) זוהו סימני יד — רמת ודאות: ${confidence}%`, videoKey: 'hand_signals' },
            { icon: '↔️', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) תנועת ראש חשודה — רמת ודאות: ${confidence}%`, videoKey: 'head_movement' },
            { icon: '📄', message: `חשד: תלמיד (שורה ${studentRow}, מושב ${studentSeat}) חשד לפתקים מוסתרים — רמת ודאות: ${confidence}%`, videoKey: 'hidden_notes' },
          ];
          const cheatType = cheatTypes[Math.floor(Math.random() * cheatTypes.length)];
          addNotification('warning', cheatType.icon, cheatType.message, cheatType.videoKey);
          setTotalAlerts(prev => prev + 1);
        }
      }

      const currentTalking = state.activeStudents.size;
      setTalkingCount(currentTalking);
      if (currentTalking === 0) setCurrentStatus('green');
      else if (currentTalking === 1) setCurrentStatus('yellow');
      else setCurrentStatus('red');

      // Update discipline score — SOFT & RANDOM
      const sc = scoreRef.current;
      const baseScore = Math.round(classroom.discipline * 100);
      
      // Natural random jitter every frame for organic feel
      const jitter = (Math.random() - 0.5) * 0.6;
      
      if (currentTalking > 0) {
        sc.talkStreak++;
        sc.quietStreak = 0;
        sc.peakTalking = Math.max(sc.peakTalking, currentTalking);
        
        // Soft gentle penalty — never crashes hard
        const penalty = 0.03 + currentTalking * 0.015 + Math.random() * 0.02;
        // Floor: 1 talker stays ~55+, 2-3 ~40+, 4+ ~30+
        const floor = currentTalking <= 1 ? 55 : currentTalking <= 3 ? 40 : 30;
        sc.score = Math.max(floor, sc.score - penalty + jitter * 0.3);
      } else {
        sc.quietStreak++;
        sc.talkStreak = 0;
        
        // Smooth random recovery
        const recovery = 0.06 + Math.random() * 0.08 + Math.min(sc.quietStreak * 0.0008, 0.15);
        sc.score = Math.min(baseScore, sc.score + recovery + jitter * 0.2);
        
        // Forget disruptions gradually
        if (sc.quietStreak > 100) {
          sc.peakTalking = Math.max(0, sc.peakTalking - 0.02);
        }
      }
      
      sc.score = Math.max(25, Math.min(100, sc.score));
      
      sc.lastTalkingCount = currentTalking;
      
      // Calculate trend every 120 frames (~2 sec)
      if (state.tick % 120 === 0) {
        const roundedScore = Math.round(sc.score);
        sc.trendSamples.push(roundedScore);
        if (sc.trendSamples.length > 10) sc.trendSamples.shift();
        
        if (sc.trendSamples.length >= 3) {
          const recent = sc.trendSamples.slice(-3);
          const older = sc.trendSamples.slice(0, 3);
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
          const diff = recentAvg - olderAvg;
          sc.trend = diff > 2 ? 1 : diff < -2 ? -1 : 0;
        }
        setScoreTrend(sc.trend);
      }
      
      setDisciplineScore(Math.round(sc.score));

      // Update activity history every 60 frames (~1 sec)
      if (state.tick % 60 === 0) {
        setActivityHistory(prev => [...prev.slice(-19), currentTalking]);
      }

      // Draw isometric view
      drawIsometricClassroom(ctx, canvas.width, canvas.height, state.activeStudents, state.tick, classroom);

      // Draw camera feed if open
      if (showCameraFeed && cameraFeedRef.current) {
        drawCameraFeed(cameraFeedRef.current, state, classroom);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [allStudents, showCameraFeed, addNotification, classroom]);

  const getNotifStyle = type => ({
    alert: { bg: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))', border: '#ef4444' },
    warning: { bg: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.05))', border: '#fbbf24' },
    success: { bg: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '#10b981' },
    system: { bg: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))', border: '#6366f1' },
    info: { bg: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(56,189,248,0.05))', border: '#38bdf8' },
  }[type] || { bg: 'rgba(100,116,139,0.1)', border: '#64748b' });

  const formatTime = d => d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{
      display: 'flex', minHeight: '100vh', width: '100%', maxWidth: '100vw',
      background: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: '#fff', direction: 'rtl', overflowX: 'hidden',
    }} className="detail-container">
      {activeVideo && (
        <VideoPreviewOverlay videoSrc={CHEAT_VIDEOS[activeVideo]} onClose={() => setActiveVideo(null)} />
      )}

      {/* Sidebar */}
      <div style={{
        width: 'min(360px, 100vw)', flexShrink: 0,
        background: 'linear-gradient(180deg, rgba(6,10,23,0.99), rgba(3,6,14,0.99))',
        borderLeft: '1px solid rgba(56,189,248,0.06)',
        padding: 'clamp(10px, 2.5vw, 16px)',
        display: 'flex', flexDirection: 'column', gap: 12,
        overflowY: 'auto', overflowX: 'hidden',
        maxHeight: '100vh', boxSizing: 'border-box',
        minWidth: 0,
      }} className="detail-sidebar">

        {/* Top bar: back + live badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
            background: 'transparent', border: '1px solid rgba(56,189,248,0.1)',
            borderRadius: 8, color: '#64748b', fontSize: 11, fontWeight: 500, cursor: 'pointer',
          }}>
            <span>→</span> חזרה
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 20, fontSize: 10, fontWeight: 600, color: '#f87171',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#ef4444',
              boxShadow: '0 0 8px #ef4444', animation: 'pulse 1.5s infinite',
            }} />
            LIVE
          </div>
        </div>

        {/* Classroom Identity */}
        <div style={{
          padding: '16px', borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(99,102,241,0.04), rgba(14,165,233,0.02))',
          border: '1px solid rgba(56,189,248,0.08)',
          position: 'relative', flexShrink: 0,
        }}>
          {/* Decorative corner accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: 60, height: 60,
            background: 'linear-gradient(135deg, rgba(56,189,248,0.1), transparent)',
            borderRadius: '16px 0 40px 0', pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, boxShadow: '0 6px 20px rgba(14,165,233,0.25)',
            }}>🏫</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{classroom.name}</h2>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{classroom.grade} • {classroom.subject} • {classroom.teacher}</div>
            </div>
          </div>
          <div style={{
            display: 'flex', gap: 8, marginTop: 12, position: 'relative',
          }}>
            {[
              { icon: '👥', val: classroom.students, lbl: 'תלמידים' },
              { icon: '📹', val: '6', lbl: 'מיקרופונים' },
              { icon: '🔍', val: '1', lbl: 'מצלמה' },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, padding: '8px 6px', borderRadius: 8,
                background: 'rgba(15,23,42,0.5)', textAlign: 'center',
              }}>
                <div style={{ fontSize: 12 }}>{s.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 8, color: '#475569', marginTop: 2 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Circular Discipline Gauge — SMART */}
        {(() => {
          const s = disciplineScore;
          const gaugeColor = s >= 85 ? '#10b981' : s >= 70 ? '#22d3ee' : s >= 50 ? '#f59e0b' : s >= 30 ? '#f97316' : '#ef4444';
          const gaugeGlow = s >= 85 ? 'rgba(16,185,129,0.4)' : s >= 70 ? 'rgba(34,211,238,0.4)' : s >= 50 ? 'rgba(245,158,11,0.4)' : s >= 30 ? 'rgba(249,115,22,0.4)' : 'rgba(239,68,68,0.5)';
          const gradeLabel = s >= 90 ? 'מצוין' : s >= 75 ? 'טוב מאוד' : s >= 60 ? 'טוב' : s >= 45 ? 'בינוני' : s >= 25 ? 'נמוך' : 'קריטי';
          const gradeDesc = s >= 90 ? 'הכיתה שקטה — ללא הפרעות'
            : s >= 75 ? 'סביבה לימודית תקינה — הפרעות מינוריות'
            : s >= 60 ? 'מספר דיבורים — נדרש ניטור'
            : s >= 45 ? 'דיבורים תכופים — שקול התערבות'
            : s >= 25 ? 'רמת רעש גבוהה — נדרשת התערבות'
            : 'מצב חירום — הפרעה מסיבית';
          const gradeEmoji = s >= 90 ? '🟢' : s >= 75 ? '🔵' : s >= 60 ? '🟡' : s >= 45 ? '🟠' : '🔴';
          const gaugeGlowLight = s >= 85 ? 'rgba(16,185,129,0.04)' : s >= 70 ? 'rgba(34,211,238,0.04)' : s >= 50 ? 'rgba(245,158,11,0.04)' : s >= 30 ? 'rgba(249,115,22,0.04)' : 'rgba(239,68,68,0.05)';
          const gaugeBorder = s >= 85 ? 'rgba(16,185,129,0.08)' : s >= 70 ? 'rgba(34,211,238,0.08)' : s >= 50 ? 'rgba(245,158,11,0.08)' : s >= 30 ? 'rgba(249,115,22,0.08)' : 'rgba(239,68,68,0.1)';
          const trendIcon = scoreTrend > 0 ? '↑' : scoreTrend < 0 ? '↓' : '→';
          const trendColor = scoreTrend > 0 ? '#10b981' : scoreTrend < 0 ? '#ef4444' : '#64748b';
          const trendLabel = scoreTrend > 0 ? 'משתפר' : scoreTrend < 0 ? 'יורד' : 'יציב';
          const trendBg = scoreTrend > 0 ? 'rgba(16,185,129,0.07)' : scoreTrend < 0 ? 'rgba(239,68,68,0.07)' : 'rgba(100,116,139,0.07)';
          const trendBorder = scoreTrend > 0 ? 'rgba(16,185,129,0.15)' : scoreTrend < 0 ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)';
          
          return (
            <div style={{
              padding: '16px', borderRadius: 16,
              background: `linear-gradient(135deg, rgba(15,23,42,0.5), ${gaugeGlowLight})`,
              border: `1px solid ${gaugeBorder}`,
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'all 0.5s ease',
            }}>
              <div style={{ position: 'relative', width: 86, height: 86, flexShrink: 0 }}>
                <svg width="86" height="86" viewBox="0 0 86 86">
                  {/* Background ring */}
                  <circle cx="43" cy="43" r="34" fill="none" stroke="rgba(56,189,248,0.06)" strokeWidth="7" />
                  {/* Track marks */}
                  {[0, 25, 50, 75, 100].map(v => {
                    const angle = -90 + (v / 100) * 360;
                    const rad = angle * Math.PI / 180;
                    const x1 = 43 + Math.cos(rad) * 30;
                    const y1 = 43 + Math.sin(rad) * 30;
                    const x2 = 43 + Math.cos(rad) * 38;
                    const y2 = 43 + Math.sin(rad) * 38;
                    return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(148,163,184,0.15)" strokeWidth="1" />;
                  })}
                  {/* Score arc */}
                  <circle cx="43" cy="43" r="34" fill="none"
                    stroke={gaugeColor}
                    strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={`${(s / 100) * 213.6} 213.6`}
                    transform="rotate(-90 43 43)"
                    style={{ filter: `drop-shadow(0 0 8px ${gaugeGlow})`, transition: 'stroke-dasharray 0.3s ease, stroke 0.5s ease' }}
                  />
                  {/* Inner circle */}
                  <circle cx="43" cy="43" r="25" fill="rgba(10,15,28,0.7)" />
                </svg>
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                }}>
                  <div style={{
                    fontSize: 22, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1,
                    color: gaugeColor,
                    textShadow: `0 0 12px ${gaugeGlow}`,
                    transition: 'color 0.5s ease',
                  }}>{s}</div>
                  <div style={{ fontSize: 6, color: '#475569', marginTop: 2, letterSpacing: '1px' }}>SCORE</div>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>רמת משמעת</span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, color: trendColor, fontFamily: 'monospace',
                    padding: '2px 6px', borderRadius: 4,
                    background: trendBg, border: `1px solid ${trendBorder}`,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>{trendIcon} {trendLabel}</span>
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 700, color: gaugeColor, marginBottom: 4,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'color 0.5s ease',
                }}>
                  <span>{gradeEmoji}</span>
                  <span>{gradeLabel}</span>
                </div>
                <div style={{ fontSize: 9, color: '#64748b', lineHeight: 1.5, marginBottom: 6 }}>
                  {gradeDesc}
                </div>
                {/* Mini bar breakdown */}
                <div style={{ display: 'flex', gap: 3, height: 4, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ flex: Math.max(1, 48 - talkingCount), background: '#10b981', borderRadius: 2, transition: 'flex 0.5s ease' }} />
                  <div style={{ flex: Math.max(0, talkingCount), background: '#ef4444', borderRadius: 2, transition: 'flex 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 8, color: '#475569' }}>
                  <span>{48 - talkingCount} שקטים</span>
                  <span>{talkingCount} מדברים</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Live Metrics - 3 column */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, flexShrink: 0 }}>
          {[
            { val: talkingCount, lbl: 'מדברים', color: talkingCount > 0 ? '#ef4444' : '#10b981', glow: talkingCount > 0 },
            { val: totalAlerts, lbl: 'התראות', color: '#f59e0b', glow: false },
            { val: 48 - talkingCount, lbl: 'שקטים', color: '#10b981', glow: false },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '12px 8px', borderRadius: 12, textAlign: 'center',
              background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(56,189,248,0.05)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 30, height: 2, borderRadius: '0 0 4px 4px',
                background: m.color, opacity: 0.6,
              }} />
              <div style={{
                fontSize: 26, fontWeight: 800, fontFamily: 'monospace', lineHeight: 1,
                color: m.color,
                textShadow: m.glow ? `0 0 16px ${m.color}66` : 'none',
              }}>{m.val}</div>
              <div style={{ fontSize: 8, color: '#475569', marginTop: 5, letterSpacing: '0.3px' }}>{m.lbl}</div>
            </div>
          ))}
        </div>

        {/* Camera Toggle */}
        <button onClick={() => setShowCameraFeed(!showCameraFeed)} style={{
          width: '100%', padding: '12px 14px',
          background: showCameraFeed
            ? 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.06))'
            : 'linear-gradient(135deg, rgba(56,189,248,0.06), rgba(99,102,241,0.04))',
          border: showCameraFeed ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(56,189,248,0.1)',
          borderRadius: 12, color: showCameraFeed ? '#f87171' : '#7dd3fc',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.3s ease',
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: showCameraFeed ? 'rgba(239,68,68,0.15)' : 'rgba(56,189,248,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
          }}>📹</span>
          {showCameraFeed ? 'סגור מצלמה' : 'תצוגת AI הולוגרפית'}
        </button>

        {/* Activity Mini-Chart (SVG sparkline) */}
        <div style={{
          padding: '14px', borderRadius: 14,
          background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(56,189,248,0.06)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
          }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', letterSpacing: '0.5px' }}>פעילות אחרונה</span>
            <span style={{
              fontSize: 8, color: '#475569', fontFamily: 'monospace',
              padding: '2px 6px', background: 'rgba(56,189,248,0.06)', borderRadius: 4,
            }}>30 דקות</span>
          </div>
          <svg width="100%" height="50" viewBox="0 0 300 50" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const maxVal = Math.max(6, ...activityHistory);
              const pts = activityHistory.map((v, i) => ({
                x: (i / (activityHistory.length - 1)) * 300,
                y: 48 - (v / maxVal) * 44,
              }));
              const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
              const areaPath = linePath + ` L300,48 L0,48 Z`;
              const last = pts[pts.length - 1];
              const lastVal = activityHistory[activityHistory.length - 1];
              const dotColor = lastVal > 0 ? '#ef4444' : '#10b981';
              return (
                <>
                  <path d={areaPath} fill="url(#chartGrad)" />
                  <path d={linePath} fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx={last.x} cy={last.y} r="3" fill={dotColor}>
                    <animate attributeName="r" values="3;5;3" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </>
              );
            })()}
          </svg>
        </div>

        {/* Alert Log */}
        <div style={{
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(56,189,248,0.06)',
          display: 'flex', flexDirection: 'column',
          height: 250, minHeight: 250, maxHeight: 250, flexShrink: 0,
        }}>
          <div style={{
            padding: '10px 14px',
            background: 'linear-gradient(135deg, rgba(15,23,42,0.7), rgba(20,28,45,0.5))',
            borderBottom: '1px solid rgba(56,189,248,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: '#10b981',
                boxShadow: '0 0 6px rgba(16,185,129,0.5)', animation: 'pulse 2s infinite',
              }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>יומן אירועים</span>
            </div>
            <span style={{
              fontSize: 8, color: '#10b981', fontFamily: 'monospace',
              padding: '2px 6px', background: 'rgba(16,185,129,0.08)', borderRadius: 4,
              border: '1px solid rgba(16,185,129,0.15)',
            }}>● LIVE</span>
          </div>
          <div style={{
            flex: 1, overflowY: 'auto', padding: '6px 8px',
            background: 'rgba(4,8,16,0.6)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {notifications.slice(0, 15).map((n, idx) => {
              const ns = getNotifStyle(n.type);
              return (
                <div key={n.id} style={{
                  padding: '7px 10px', borderRadius: 8,
                  background: idx === 0 ? 'rgba(56,189,248,0.04)' : 'rgba(15,23,42,0.35)',
                  borderRight: `2px solid ${ns.border}`,
                  opacity: Math.max(0.4, 1 - idx * 0.04),
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{ fontSize: 11 }}>{n.icon}</span>
                    {n.videoKey && CHEAT_VIDEOS[n.videoKey] && (
                      <span onClick={(e) => { e.stopPropagation(); setActiveVideo(n.videoKey); }}
                        style={{
                          cursor: 'pointer', fontSize: 10, display: 'inline-flex',
                          alignItems: 'center', justifyContent: 'center',
                          width: 18, height: 18, borderRadius: 5,
                          background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.15)',
                          color: '#38bdf8',
                        }} title="צפה בהקלטה">▶</span>
                    )}
                    <span style={{ fontSize: 8, color: '#475569', fontFamily: 'monospace', marginRight: 'auto' }}>{formatTime(n.time)}</span>
                  </div>
                  <div style={{ fontSize: 9, lineHeight: 1.3, color: ns.border, opacity: 0.85 }}>{n.message}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Legend + System */}
        <div style={{
          padding: '8px 12px', borderRadius: 8,
          background: 'rgba(15,23,42,0.3)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { color: '#3d4f65', label: 'שקט' },
              { color: '#ef4444', label: 'מדבר' },
              { color: '#10b981', label: 'CAM' },
              { color: '#6366f1', label: 'MIC' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8, color: '#475569' }}>
                <span style={{ width: 6, height: 6, borderRadius: 2, background: item.color, display: 'inline-block' }} />
                {item.label}
              </div>
            ))}
          </div>
          <span style={{ fontSize: 7, color: '#334155', fontFamily: 'monospace' }}>CatCheat v2.1</span>
        </div>
      </div>

      {/* Main View */}
      <div style={{
        flex: 1, padding: 'clamp(10px, 2vw, 20px)',
        display: 'flex', flexDirection: 'column', gap: 16,
        minWidth: 0, overflowX: 'hidden',
      }} className="detail-main">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="detail-header">
          <h1 style={{
            fontSize: 'clamp(16px, 2.5vw, 22px)', fontWeight: 700, margin: 0,
            background: 'linear-gradient(90deg, #fff, #c7d2fe)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }} className="detail-page-title">📹 צפייה חיה — {classroom.name} | תצוגה איזומטרית 3D</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444',
              borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#ef4444',
            }}>
              <span style={{
                width: 10, height: 10, borderRadius: '50%', background: '#ef4444',
                boxShadow: '0 0 10px #ef4444', animation: 'pulse 1.5s infinite',
              }} />
              שידור חי
            </div>
          </div>
        </div>

        {/* Camera Feed - Popup Overlay */}
        {showCameraFeed && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(12px)',
          }} onClick={() => setShowCameraFeed(false)}>
            <div style={{
              position: 'relative', width: '92vw', maxWidth: 1100, borderRadius: 20,
              overflow: 'hidden', border: '2px solid rgba(56,189,248,0.5)',
              boxShadow: '0 0 80px rgba(56,189,248,0.3), 0 0 200px rgba(56,189,248,0.08)',
              background: '#000',
            }} onClick={e => e.stopPropagation()}>
              {/* Close button */}
              <button onClick={() => setShowCameraFeed(false)} style={{
                position: 'absolute', top: 16, right: 16, width: 44, height: 44,
                borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)',
                background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: 22, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10001, transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.9)'; e.target.style.borderColor = '#ef4444'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(0,0,0,0.8)'; e.target.style.borderColor = 'rgba(255,255,255,0.3)'; }}
              >✕</button>

              {/* Header */}
              <div style={{
                padding: '14px 24px',
                background: 'linear-gradient(135deg, rgba(8,15,30,0.98), rgba(4,8,18,0.98))',
                borderBottom: '1px solid rgba(56,189,248,0.2)',
                display: 'flex', alignItems: 'center', gap: 12,
                fontSize: 15, fontWeight: 700, color: '#38bdf8', direction: 'rtl',
              }}>
                <span style={{ fontSize: 20 }}>📹</span>
                <span>שידור מצלמה חי — AI Holographic View</span>
                <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    padding: '4px 12px', background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, fontSize: 11,
                    color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981',
                      boxShadow: '0 0 8px #10b981', animation: 'pulse 1.5s infinite' }} />
                    AI ACTIVE
                  </span>
                  <span style={{
                    padding: '4px 12px', background: 'rgba(239,68,68,0.15)',
                    border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, fontSize: 11,
                    color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
                      boxShadow: '0 0 8px #ef4444', animation: 'pulse 1.5s infinite' }} />
                    REC
                  </span>
                </div>
              </div>

              {/* Canvas */}
              <div style={{ position: 'relative', background: '#000', width: '100%' }}>
                <canvas ref={cameraFeedRef} width={960} height={540} style={{
                  width: '100%', height: 'auto', display: 'block',
                }} />
              </div>

              {/* Footer info */}
              <div style={{
                display: 'flex', justifyContent: 'space-around', padding: '12px 20px',
                background: 'linear-gradient(135deg, rgba(8,15,30,0.98), rgba(4,8,18,0.98))',
                borderTop: '1px solid rgba(56,189,248,0.15)',
                fontSize: 11, color: '#64748b', direction: 'rtl',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  <span>מצלמה פעילה</span>
                </div>
                <span>🧠 AI זיהוי פעיל</span>
                <span>📊 דיוק: 98.5%</span>
                <span>🔒 הקלטה מאובטחת</span>
              </div>
            </div>
          </div>
        )}

        {/* Isometric Canvas */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(7,11,20,0.9))',
          borderRadius: 20, border: '1px solid rgba(99,102,241,0.1)',
          padding: 'clamp(8px, 2vw, 16px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'auto',
        }} className="detail-canvas-box">
          <canvas ref={canvasRef} width={1000} height={600} style={{
            borderRadius: 14, boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            maxWidth: '100%', height: 'auto',
          }} />
        </div>

        <div style={{ display: 'flex', gap: 'clamp(8px, 1.5vw, 16px)', flexWrap: 'wrap' }} className="detail-bottom-bar">
          {[
            { icon: '📹', text: 'מצלמה: פעילה' },
            { icon: '🎤', text: '6 מיקרופונים פעילים' },
            { icon: '🧠', text: 'זיהוי AI: פעיל' },
            { icon: '📊', text: 'דיוק: 98.5%' },
            { icon: '🔒', text: 'הקלטה מאובטחת' },
            { icon: '⚡', text: 'תגובה: 1.8s' },
          ].map((item, i) => (
            <div key={i} style={{
              flex: '1 1 auto', minWidth: 120, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              padding: 'clamp(10px, 1.5vw, 14px)',
              background: 'rgba(30,41,59,0.6)', borderRadius: 12,
              fontSize: 'clamp(10px, 1.2vw, 12px)', color: '#94a3b8',
            }}>
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        @media (max-width: 768px) {
          .detail-container { flex-direction: column !important; overflow-x: hidden !important; }
          .detail-sidebar { width: 100% !important; max-height: none !important; border-left: none !important; padding: 10px !important; min-width: 0 !important; overflow-x: hidden !important; }
          .detail-main { width: 100% !important; padding: 8px !important; min-width: 0 !important; overflow-x: hidden !important; }
          .detail-canvas-box { padding: 4px !important; border-radius: 10px !important; overflow: hidden !important; }
          .detail-canvas-box canvas { max-width: 100% !important; height: auto !important; }
          .detail-bottom-bar { flex-wrap: wrap !important; gap: 4px !important; }
          .detail-bottom-bar > div { min-width: calc(50% - 4px) !important; font-size: 9px !important; padding: 6px !important; }
          .detail-header { flex-wrap: wrap !important; gap: 6px !important; }
          .detail-page-title { font-size: 14px !important; }
          .camera-info { flex-wrap: wrap !important; gap: 4px !important; font-size: 9px !important; }
        }
        @media (max-width: 400px) {
          .detail-sidebar { padding: 8px !important; }
          .detail-main { padding: 6px !important; }
          .detail-bottom-bar > div { min-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

// ─── HOLOGRAPHIC CAMERA FEED RENDERER ─────────────────────────────
function drawCameraFeed(camCanvas, state, classroom) {
  const ctx = camCanvas.getContext('2d');
  const W = camCanvas.width;
  const H = camCanvas.height;
  const t = state.tick;

  // ── BACKGROUND ──
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.38, 0, W * 0.5, H * 0.5, W * 0.85);
  bg.addColorStop(0, '#081830');
  bg.addColorStop(0.4, '#050f22');
  bg.addColorStop(1, '#010810');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── SCROLLING CODE on sides ──
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#38bdf8';
  ctx.font = '9px monospace';
  const codeLines = [
    'detect_motion(frame)', 'analyze_pose(skeleton)', 'if conf > 0.85:',
    'track_id = assign()', 'bbox = [x,y,w,h]', 'alert.trigger()',
    'model.predict(img)', 'features = extract()', 'class_id: student',
    'neural_net.forward()', 'attention_map()', 'risk_score: 0.92',
    'frame_buffer.push()', 'timestamp = now()', 'event_log.write()',
    'calibrate_lens()', 'depth_map.compute()', 'skeleton_fit()',
  ];
  for (let i = 0; i < 22; i++) {
    const yOff = ((t * 0.4 + i * 17) % (H + 40)) - 20;
    ctx.fillText(codeLines[i % codeLines.length], 8, yOff);
    ctx.fillText(codeLines[(i + 7) % codeLines.length], W - 130, yOff);
  }
  ctx.restore();

  // ── CAMERA PERSPECTIVE SETUP ──
  // Vanishing point at center-top (camera mounted on ceiling looking down)
  const vpX = W * 0.5;
  const vpY = H * 0.12;

  // ── FLOOR GRID ──
  ctx.strokeStyle = 'rgba(56,189,248,0.08)';
  ctx.lineWidth = 0.5;

  // Horizontal lines receding
  for (let i = 0; i <= 20; i++) {
    const p = i / 20;
    const y = vpY + (H - vpY) * p;
    const halfW = 10 + (W * 0.52) * p;
    ctx.beginPath();
    ctx.moveTo(vpX - halfW, y);
    ctx.lineTo(vpX + halfW, y);
    ctx.stroke();
  }

  // Vertical lines converging to vanish point
  for (let i = -10; i <= 10; i++) {
    const bottomX = vpX + i * (W * 0.052);
    ctx.beginPath();
    ctx.moveTo(vpX + i * 1, vpY);
    ctx.lineTo(bottomX, H + 5);
    ctx.stroke();
  }

  // Brighter center aisle
  ctx.strokeStyle = 'rgba(56,189,248,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(vpX, vpY); ctx.lineTo(vpX, H); ctx.stroke();

  // ── BACK WALL ──
  const wallY = vpY + (H - vpY) * 0.08;
  const wallHalfW = 10 + (W * 0.52) * 0.08;
  ctx.strokeStyle = 'rgba(56,189,248,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(vpX - wallHalfW, wallY);
  ctx.lineTo(vpX + wallHalfW, wallY);
  ctx.stroke();
  // Wall vertical edges
  ctx.beginPath();
  ctx.moveTo(vpX - wallHalfW, wallY); ctx.lineTo(vpX - wallHalfW - 6, wallY + 15);
  ctx.moveTo(vpX + wallHalfW, wallY); ctx.lineTo(vpX + wallHalfW + 6, wallY + 15);
  ctx.stroke();

  // ── WHITEBOARD ──
  const wbW = wallHalfW * 1.2;
  const wbH = 22;
  const wbY = wallY - wbH * 0.3;
  ctx.save();
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = 'rgba(56,189,248,0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(vpX - wbW * 0.5, wbY, wbW, wbH);
  ctx.fillStyle = 'rgba(56,189,248,0.025)';
  ctx.fillRect(vpX - wbW * 0.5, wbY, wbW, wbH);
  // Scan line
  const scanWb = wbY + ((t * 0.6) % wbH);
  ctx.strokeStyle = 'rgba(56,189,248,0.2)';
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(vpX - wbW * 0.48, scanWb); ctx.lineTo(vpX + wbW * 0.48, scanWb); ctx.stroke();
  ctx.restore();

  // ── SYMMETRIC DESKS & STUDENTS ──
  const rows = 4;
  const cols = 6;

  for (let row = 0; row < rows; row++) {
    // Each row: perspective Y position
    const rowT = (row + 1.2) / (rows + 1);
    const rowY = vpY + (H - vpY) * (0.18 + rowT * 0.72);
    const rowSpreadHalf = 10 + (W * 0.52) * (0.18 + rowT * 0.72);
    const rowScale = 0.5 + rowT * 0.9;

    for (let col = 0; col < cols; col++) {
      const studentId1 = row * 12 + col * 2 + 1;
      const studentId2 = row * 12 + col * 2 + 2;
      const isActive1 = state.activeStudents.has(studentId1);
      const isActive2 = state.activeStudents.has(studentId2);

      // Symmetric X: evenly spaced within the row's spread
      const colT = (col + 0.5) / cols;
      const deskX = (vpX - rowSpreadHalf * 0.85) + colT * rowSpreadHalf * 1.7;

      // Desk dimensions scale with perspective
      const dW = 34 * rowScale;
      const dH = 7 * rowScale;
      const dY = rowY;

      // Desk perspective shape: slight trapezoid narrowing toward vanish
      const topNarrow = 0.92;
      const dTopL = deskX - dW * topNarrow;
      const dTopR = deskX + dW * topNarrow;
      const dBotL = deskX - dW;
      const dBotR = deskX + dW;
      const dTopY = dY - dH;
      const dBotY = dY;

      // ── DESK ──
      ctx.save();
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 5;
      ctx.strokeStyle = 'rgba(56,189,248,0.3)';
      ctx.lineWidth = 1;

      // Tabletop
      ctx.beginPath();
      ctx.moveTo(dTopL, dTopY);
      ctx.lineTo(dTopR, dTopY);
      ctx.lineTo(dBotR, dBotY);
      ctx.lineTo(dBotL, dBotY);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(56,189,248,0.02)';
      ctx.fill();

      // Center divider
      const divTopX = deskX;
      const divBotX = deskX;
      ctx.strokeStyle = 'rgba(56,189,248,0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(divTopX, dTopY);
      ctx.lineTo(divBotX, dBotY);
      ctx.stroke();

      // 4 Legs
      const legLen = 10 * rowScale;
      ctx.strokeStyle = 'rgba(56,189,248,0.2)';
      ctx.lineWidth = 0.8;
      const legPositions = [
        { x: dTopL + dW * 0.15, y: dTopY },
        { x: dTopR - dW * 0.15, y: dTopY },
        { x: dBotL + dW * 0.1, y: dBotY },
        { x: dBotR - dW * 0.1, y: dBotY },
      ];
      legPositions.forEach(lp => {
        ctx.beginPath();
        ctx.moveTo(lp.x, lp.y);
        ctx.lineTo(lp.x, lp.y + legLen);
        ctx.stroke();
      });

      ctx.restore();

      // ── STUDENTS ──
      const sOffsetX = dW * 0.42;
      drawWireframeStudent(ctx, deskX - sOffsetX, dY - dH - 1, rowScale, isActive1, t, studentId1);
      drawWireframeStudent(ctx, deskX + sOffsetX, dY - dH - 1, rowScale, isActive2, t, studentId2);
    }
  }

  // ── MOVING SCAN LINE ──
  const scanLineY = (t * 1.2) % H;
  const scanGrad = ctx.createLinearGradient(0, scanLineY - 20, 0, scanLineY + 20);
  scanGrad.addColorStop(0, 'rgba(56,189,248,0)');
  scanGrad.addColorStop(0.5, 'rgba(56,189,248,0.07)');
  scanGrad.addColorStop(1, 'rgba(56,189,248,0)');
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanLineY - 20, W, 40);

  // ── CRT SCANLINES ──
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 0; y < H; y += 2) {
    ctx.fillRect(0, y, W, 1);
  }

  // ── VIGNETTE ──
  const vignette = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.22, W * 0.5, H * 0.5, W * 0.65);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // ── LENS BORDER ──
  ctx.strokeStyle = 'rgba(56,189,248,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(W * 0.5, H * 0.5, W * 0.485, H * 0.475, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ── CORNER BRACKETS ──
  const bLen = 30;
  const bPad = 6;
  ctx.strokeStyle = 'rgba(56,189,248,0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bPad, bPad + bLen); ctx.lineTo(bPad, bPad); ctx.lineTo(bPad + bLen, bPad); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - bPad - bLen, bPad); ctx.lineTo(W - bPad, bPad); ctx.lineTo(W - bPad, bPad + bLen); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bPad, H - bPad - bLen); ctx.lineTo(bPad, H - bPad); ctx.lineTo(bPad + bLen, H - bPad); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - bPad - bLen, H - bPad); ctx.lineTo(W - bPad, H - bPad); ctx.lineTo(W - bPad, H - bPad - bLen); ctx.stroke();

  // ── HUD: TOP-LEFT ──
  ctx.fillStyle = 'rgba(0,5,15,0.7)';
  roundRect(ctx, 10, 10, 180, 48, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, 10, 10, 180, 48, 5);
  ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  const now = new Date();
  ctx.fillText(`CAM-01  ${now.toLocaleDateString('he-IL')}`, 20, 30);
  ctx.fillStyle = '#0ea5e9';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(now.toLocaleTimeString('he-IL'), 20, 48);

  // ── HUD: TOP-RIGHT REC ──
  if (Math.floor(t / 25) % 2 === 0) {
    ctx.save();
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(W - 24, 22, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('REC', W - 40, 27);

  // ── HUD: BOTTOM-RIGHT (classroom name) ──
  ctx.fillStyle = 'rgba(0,5,15,0.7)';
  roundRect(ctx, W - 135, H - 38, 125, 28, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, W - 135, H - 38, 125, 28, 5);
  ctx.stroke();
  ctx.fillStyle = '#e0f2fe';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(classroom.name, W - 18, H - 19);

  // ── HUD: BOTTOM-LEFT (AI status) ──
  ctx.fillStyle = 'rgba(0,5,15,0.7)';
  roundRect(ctx, 10, H - 38, 220, 28, 5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(56,189,248,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, 10, H - 38, 220, 28, 5);
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(24, H - 24, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('AI MONITORING • ACTIVE', 36, H - 20);

  // ── HUD: TOP-CENTER ALERT ──
  if (state.activeStudents.size > 0) {
    const alertW = 160;
    const alertX = (W - alertW) / 2;
    ctx.fillStyle = 'rgba(239,68,68,0.12)';
    roundRect(ctx, alertX, 10, alertW, 28, 5);
    ctx.fill();
    ctx.strokeStyle = `rgba(239,68,68,${0.4 + Math.sin(t * 0.08) * 0.2})`;
    ctx.lineWidth = 1;
    roundRect(ctx, alertX, 10, alertW, 28, 5);
    ctx.stroke();
    ctx.fillStyle = '#f87171';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`⚠ ${state.activeStudents.size} DETECTED`, W / 2, 29);
  }

  // ── BOTTOM CENTER: AI confidence bar ──
  const barW = 200;
  const barH = 6;
  const barX = (W - barW) / 2;
  const barY = H - 12;
  ctx.fillStyle = 'rgba(56,189,248,0.1)';
  ctx.fillRect(barX, barY, barW, barH);
  const conf = 0.95 + Math.sin(t * 0.02) * 0.04;
  const confGrad = ctx.createLinearGradient(barX, 0, barX + barW * conf, 0);
  confGrad.addColorStop(0, 'rgba(56,189,248,0.6)');
  confGrad.addColorStop(1, 'rgba(16,185,129,0.6)');
  ctx.fillStyle = confGrad;
  ctx.fillRect(barX, barY, barW * conf, barH);
  ctx.fillStyle = '#64748b';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`AI CONFIDENCE: ${(conf * 100).toFixed(1)}%`, W / 2, barY - 3);
}

function drawWireframeStudent(ctx, x, baseY, scale, isActive, tick, id) {
  const s = scale * 1.15;
  const headR = 5 * s;
  const bodyH = 15 * s;
  const shoulderW = 10 * s;
  const headY = baseY - bodyH - headR * 1.8;
  const neckY = headY + headR;
  const shoulderY = neckY + 3.5 * s;
  const hipY = shoulderY + bodyH * 0.55;

  const baseColor = isActive ? '#ef4444' : '#38bdf8';
  const glowColor = isActive ? '#ef4444' : '#0ea5e9';
  const alphaBase = isActive ? 0.14 : 0.04;

  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = isActive ? 16 : 5;
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = isActive ? 1.6 : 0.9;

  // ── ALERT EFFECTS ──
  if (isActive) {
    // Pulse glow
    const pulseR = (22 + Math.sin(tick * 0.12) * 5) * s;
    const glow = ctx.createRadialGradient(x, headY + bodyH * 0.25, 0, x, headY + bodyH * 0.25, pulseR);
    glow.addColorStop(0, 'rgba(239,68,68,0.18)');
    glow.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, headY + bodyH * 0.25, pulseR, 0, Math.PI * 2);
    ctx.fill();

    // Outer detection ring
    ctx.strokeStyle = `rgba(239,68,68,${0.25 + Math.sin(tick * 0.08) * 0.15})`;
    ctx.lineWidth = 1;
    const ringR = (24 + Math.sin(tick * 0.1) * 3) * s;
    ctx.beginPath();
    ctx.arc(x, headY + bodyH * 0.25, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Target brackets
    const bSz = 22 * s;
    const cy = headY + bodyH * 0.2;
    ctx.strokeStyle = 'rgba(239,68,68,0.45)';
    ctx.lineWidth = 1.2;
    const bC = 5 * s;
    ctx.beginPath(); ctx.moveTo(x - bSz, cy - bSz + bC); ctx.lineTo(x - bSz, cy - bSz); ctx.lineTo(x - bSz + bC, cy - bSz); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + bSz - bC, cy - bSz); ctx.lineTo(x + bSz, cy - bSz); ctx.lineTo(x + bSz, cy - bSz + bC); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - bSz, cy + bSz - bC); ctx.lineTo(x - bSz, cy + bSz); ctx.lineTo(x - bSz + bC, cy + bSz); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + bSz - bC, cy + bSz); ctx.lineTo(x + bSz, cy + bSz); ctx.lineTo(x + bSz, cy + bSz - bC); ctx.stroke();

    ctx.strokeStyle = baseColor;
    ctx.lineWidth = 1.6;
  }

  // ── HEAD ──
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = `rgba(${isActive ? '239,68,68' : '56,189,248'},${alphaBase})`;
  ctx.fill();
  // Head wireframe cross
  ctx.save();
  ctx.lineWidth = 0.4;
  ctx.strokeStyle = `rgba(${isActive ? '239,68,68' : '56,189,248'},0.3)`;
  ctx.beginPath(); ctx.moveTo(x - headR, headY); ctx.lineTo(x + headR, headY); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, headY, headR * 0.35, headR, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // ── NECK ──
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = isActive ? 1.6 : 0.9;
  ctx.beginPath();
  ctx.moveTo(x, headY + headR);
  ctx.lineTo(x, shoulderY);
  ctx.stroke();

  // ── SHOULDERS ──
  ctx.beginPath();
  ctx.moveTo(x - shoulderW, shoulderY);
  ctx.lineTo(x + shoulderW, shoulderY);
  ctx.stroke();

  // ── TORSO ──
  ctx.beginPath();
  ctx.moveTo(x - shoulderW, shoulderY);
  ctx.lineTo(x - shoulderW * 0.55, hipY);
  ctx.lineTo(x + shoulderW * 0.55, hipY);
  ctx.lineTo(x + shoulderW, shoulderY);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = `rgba(${isActive ? '239,68,68' : '56,189,248'},${alphaBase * 1.5})`;
  ctx.fill();

  // Torso wireframe
  ctx.save();
  ctx.lineWidth = 0.35;
  ctx.strokeStyle = `rgba(${isActive ? '239,68,68' : '56,189,248'},0.2)`;
  for (let i = 1; i <= 3; i++) {
    const ly = shoulderY + (hipY - shoulderY) * (i / 4);
    const narrowFactor = 1 - (i / 4) * 0.45;
    ctx.beginPath();
    ctx.moveTo(x - shoulderW * narrowFactor, ly);
    ctx.lineTo(x + shoulderW * narrowFactor, ly);
    ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(x, shoulderY); ctx.lineTo(x, hipY); ctx.stroke();
  ctx.restore();

  // ── ARMS ──
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = isActive ? 1.6 : 0.9;
  const elbowY = shoulderY + bodyH * 0.3;
  const handY = hipY + 3 * s;
  ctx.beginPath();
  ctx.moveTo(x - shoulderW, shoulderY);
  ctx.lineTo(x - shoulderW * 1.15, elbowY);
  ctx.lineTo(x - shoulderW * 0.45, handY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + shoulderW, shoulderY);
  ctx.lineTo(x + shoulderW * 1.15, elbowY);
  ctx.lineTo(x + shoulderW * 0.45, handY);
  ctx.stroke();

  // ── ALERT ICON ──
  if (isActive && Math.floor(tick / 15) % 2 === 0) {
    ctx.fillStyle = '#ef4444';
    ctx.font = `bold ${9 * s}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('⚠', x, headY - headR - 6 * s);
  }

  ctx.restore();
}

// Rounded rect helper
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}