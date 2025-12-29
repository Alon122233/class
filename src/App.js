import React, { useState, useEffect, useRef } from 'react';

export default function ClassroomNoiseControl() {
  // System states
  const [systemActive, setSystemActive] = useState(true);
  const [modes, setModes] = useState({
    studentChatter: true,
    outsideNoise: true,
    teacherMode: true,
    testMode: false,
    groupWork: false,
    presentationMode: false,
  });
  
  // AI Notification Log
  const [notifications, setNotifications] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), type: 'system', icon: '🟢', message: 'AI System initialized successfully', area: null },
    { id: 2, time: new Date().toLocaleTimeString(), type: 'info', icon: '🤖', message: 'AI monitoring active - All microphones online', area: null },
  ]);
  
  // Animation state
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const stateRef = useRef({
    noiseWaves: [],
    cancelWaves: [],
    tick: 0,
    activeSpeakers: new Set(),
    activeStudents: new Set(),
    outsideNoiseActive: false,
    teacherSpeaking: false,
    lastNoiseTime: 0,
    lastOutsideTime: 0,
    lastTeacherTime: 0,
    lastNotificationTime: 0,
  });

  // Add notification helper
  const addNotification = (type, icon, message, area = null) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      icon,
      message,
      area,
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  };

  // Classroom layout
  const classroom = {
    width: 900,
    height: 550,
    desks: [],
    teacher: { x: 450, y: 490 },
    whiteboard: { x: 175, y: 470, w: 550, h: 55 },
    door: { x: 850, y: 220, w: 40, h: 90 },
    windows: [
      { x: 5, y: 60, w: 20, h: 100 },
      { x: 5, y: 180, w: 20, h: 100 },
      { x: 5, y: 300, w: 20, h: 100 },
    ],
    speakers: [
      { id: 1, x: 80, y: 25, label: 'SPK-1' },
      { id: 2, x: 300, y: 25, label: 'SPK-2' },
      { id: 3, x: 520, y: 25, label: 'SPK-3' },
      { id: 4, x: 740, y: 25, label: 'SPK-4' },
      { id: 5, x: 80, y: 420, label: 'SPK-5' },
      { id: 6, x: 740, y: 420, label: 'SPK-6' },
    ],
    microphones: [
      { id: 1, x: 180, y: 130, label: 'MIC-1', area: 'Back-Left' },
      { id: 2, x: 450, y: 130, label: 'MIC-2', area: 'Back-Center' },
      { id: 3, x: 720, y: 130, label: 'MIC-3', area: 'Back-Right' },
      { id: 4, x: 180, y: 280, label: 'MIC-4', area: 'Front-Left' },
      { id: 5, x: 450, y: 280, label: 'MIC-5', area: 'Front-Center' },
      { id: 6, x: 720, y: 280, label: 'MIC-6', area: 'Front-Right' },
    ],
  };

  // Generate desks and students
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      const x = 100 + col * 130;
      const y = 80 + row * 90;
      classroom.desks.push({
        x,
        y,
        students: [
          { id: row * 12 + col * 2 + 1, x: x - 18, y: y - 5 },
          { id: row * 12 + col * 2 + 2, x: x + 18, y: y - 5 },
        ],
      });
    }
  }

  const allStudents = classroom.desks.flatMap(desk => desk.students);

  // Find nearest microphone to a position
  const findNearestMic = (x, y) => {
    let nearest = classroom.microphones[0];
    let minDist = Infinity;
    classroom.microphones.forEach(mic => {
      const dist = Math.sqrt(Math.pow(mic.x - x, 2) + Math.pow(mic.y - y, 2));
      if (dist < minDist) {
        minDist = dist;
        nearest = mic;
      }
    });
    return nearest;
  };

  // Noise levels for UI
  const [noiseLevels, setNoiseLevels] = useState({
    overall: 35,
    students: 20,
    outside: 10,
    reduced: 92,
  });

  const [stats, setStats] = useState({
    activeStudents: 0,
    activeSpeakers: 0,
    cancelledWaves: 0,
  });

  // Mode change notifications
  useEffect(() => {
    if (modes.testMode) {
      addNotification('alert', '📝', 'EXAM MODE ACTIVATED - Maximum silence enforced', null);
      addNotification('info', '🤖', 'AI sensitivity increased to detect whispers', null);
    }
  }, [modes.testMode]);

  useEffect(() => {
    if (modes.groupWork) {
      addNotification('info', '👥', 'GROUP WORK MODE - Allowing moderate conversation', null);
    }
  }, [modes.groupWork]);

  useEffect(() => {
    if (modes.presentationMode) {
      addNotification('info', '📊', 'PRESENTATION MODE - Focus on speaker area', null);
    }
  }, [modes.presentationMode]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const animate = (timestamp) => {
      const state = stateRef.current;
      state.tick++;
      
      // Clear canvas
      ctx.clearRect(0, 0, classroom.width, classroom.height);
      
      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, classroom.width, classroom.height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, classroom.width, classroom.height);
      
      // Floor pattern
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.08)';
      ctx.lineWidth = 1;
      for (let x = 0; x < classroom.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, classroom.height);
        ctx.stroke();
      }
      for (let y = 0; y < classroom.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(classroom.width, y);
        ctx.stroke();
      }
      
      // Generate noise based on modes
      if (systemActive) {
        // Student chatter
        if ((modes.studentChatter || modes.testMode) && timestamp - state.lastNoiseTime > 1500) {
          if (Math.random() < (modes.testMode ? 0.2 : modes.groupWork ? 0.35 : 0.3)) {
            state.lastNoiseTime = timestamp;
            const student = allStudents[Math.floor(Math.random() * allStudents.length)];
            state.activeStudents.add(student.id);
            
            // Find nearest mic and add AI notification
            const nearestMic = findNearestMic(student.x, student.y);
            const confidence = (85 + Math.random() * 14).toFixed(1);
            
            if (modes.testMode) {
              addNotification('warning', '⚠️', `AI detected student talking during EXAM near ${nearestMic.label} (${nearestMic.area})`, nearestMic.area);
              addNotification('action', '🔊', `Initiating noise cancellation - Confidence: ${confidence}%`, nearestMic.area);
            } else if (timestamp - state.lastNotificationTime > 3000) {
              state.lastNotificationTime = timestamp;
              const messages = [
                `AI recognized voice activity in ${nearestMic.area} area (${nearestMic.label})`,
                `Speech pattern detected near ${nearestMic.label} - ${nearestMic.area} zone`,
                `${nearestMic.label} picked up student conversation - Confidence: ${confidence}%`,
                `Voice analysis: Student talking detected at ${nearestMic.area}`,
              ];
              addNotification('detect', '🎤', messages[Math.floor(Math.random() * messages.length)], nearestMic.area);
            }
            
            state.noiseWaves.push({
              id: Date.now() + Math.random(),
              x: student.x,
              y: student.y,
              radius: 0,
              maxRadius: 80,
              speed: 1.2,
              type: 'student',
              sourceId: student.id,
              cancelled: false,
            });
            
            setTimeout(() => state.activeStudents.delete(student.id), 2500);
          }
        }
        
        // Outside noise
        if (modes.outsideNoise && timestamp - state.lastOutsideTime > 4000) {
          if (Math.random() < 0.3) {
            state.lastOutsideTime = timestamp;
            state.outsideNoiseActive = true;
            const winIndex = Math.floor(Math.random() * classroom.windows.length);
            const win = classroom.windows[winIndex];
            
            const noiseTypes = ['traffic', 'construction', 'voices', 'vehicle horn', 'siren'];
            const noiseType = noiseTypes[Math.floor(Math.random() * noiseTypes.length)];
            const decibels = (55 + Math.random() * 25).toFixed(0);
            
            addNotification('external', '🚗', `AI detected external noise (${noiseType}) from Window ${winIndex + 1} - ${decibels}dB`, `Window ${winIndex + 1}`);
            addNotification('action', '🔊', `Activating speakers SPK-5, SPK-6 for cancellation`, null);
            
            state.noiseWaves.push({
              id: Date.now() + Math.random(),
              x: win.x + win.w,
              y: win.y + win.h / 2,
              radius: 0,
              maxRadius: 200,
              speed: 1.5,
              type: 'outside',
              cancelled: false,
            });
            
            setTimeout(() => {
              state.outsideNoiseActive = false;
              addNotification('success', '✅', `External noise successfully cancelled - Reduction: ${(85 + Math.random() * 12).toFixed(0)}%`, null);
            }, 3000);
          }
        }
        
        // Teacher speaking
        if (modes.teacherMode && timestamp - state.lastTeacherTime > 5000) {
          if (Math.random() < 0.25) {
            state.lastTeacherTime = timestamp;
            state.teacherSpeaking = true;
            
            addNotification('teacher', '👨‍🏫', 'AI recognized teacher voice - Cancellation bypassed', 'Teacher Area');
            
            state.noiseWaves.push({
              id: Date.now() + Math.random(),
              x: classroom.teacher.x,
              y: classroom.teacher.y,
              radius: 0,
              maxRadius: 250,
              speed: 1.8,
              type: 'teacher',
              cancelled: false,
            });
            
            setTimeout(() => state.teacherSpeaking = false, 3500);
          }
        }
      }
      
      // Draw windows
      classroom.windows.forEach(win => {
        if (state.outsideNoiseActive) {
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 20;
        }
        ctx.fillStyle = state.outsideNoiseActive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.15)';
        ctx.fillRect(win.x, win.y, win.w, win.h);
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(win.x, win.y, win.w, win.h);
        ctx.beginPath();
        ctx.moveTo(win.x, win.y + win.h / 2);
        ctx.lineTo(win.x + win.w, win.y + win.h / 2);
        ctx.stroke();
      });
      
      // Draw door
      ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
      ctx.fillRect(classroom.door.x, classroom.door.y, classroom.door.w, classroom.door.h);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(classroom.door.x, classroom.door.y, classroom.door.w, classroom.door.h);
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(classroom.door.x + 10, classroom.door.y + 50, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw whiteboard
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = 'rgba(255,255,255,0.3)';
      ctx.shadowBlur = 15;
      ctx.fillRect(classroom.whiteboard.x, classroom.whiteboard.y, classroom.whiteboard.w, classroom.whiteboard.h);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 3;
      ctx.strokeRect(classroom.whiteboard.x, classroom.whiteboard.y, classroom.whiteboard.w, classroom.whiteboard.h);
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WHITEBOARD', classroom.whiteboard.x + classroom.whiteboard.w / 2, classroom.whiteboard.y + 33);
      
      // Draw desks
      classroom.desks.forEach(desk => {
        ctx.fillStyle = 'rgba(51, 65, 85, 0.7)';
        ctx.fillRect(desk.x - 40, desk.y - 20, 80, 40);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(desk.x - 40, desk.y - 20, 80, 40);
      });
      
      // Process and draw noise waves
      state.activeSpeakers.clear();
      let cancelledCount = 0;
      
      state.noiseWaves = state.noiseWaves.filter(wave => {
        wave.radius += wave.speed;
        if (wave.radius >= wave.maxRadius) return false;
        
        const opacity = Math.max(0, 1 - wave.radius / wave.maxRadius);
        let color, shouldCancel = false;
        
        if (wave.type === 'student') {
          color = `rgba(251, 146, 60, ${opacity * 0.6})`;
          shouldCancel = modes.studentChatter || modes.testMode;
        } else if (wave.type === 'outside') {
          color = `rgba(239, 68, 68, ${opacity * 0.7})`;
          shouldCancel = modes.outsideNoise;
        } else if (wave.type === 'teacher') {
          color = `rgba(34, 197, 94, ${opacity * 0.6})`;
          shouldCancel = !modes.teacherMode;
        }
        
        // Draw noise wave
        for (let i = 0; i < 3; i++) {
          const r = wave.radius - i * 8;
          if (r > 0) {
            ctx.beginPath();
            ctx.arc(wave.x, wave.y, r, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3 - i;
            ctx.stroke();
          }
        }
        
        // Trigger speaker cancellation
        if (systemActive && shouldCancel && wave.radius > 15 && !wave.cancelled) {
          wave.cancelled = true;
          cancelledCount++;
          
          classroom.speakers.forEach((speaker, idx) => {
            const dist = Math.sqrt(Math.pow(speaker.x - wave.x, 2) + Math.pow(speaker.y - wave.y, 2));
            if (dist < 400) {
              state.activeSpeakers.add(speaker.id);
              
              state.cancelWaves.push({
                id: Date.now() + idx + Math.random(),
                x: speaker.x,
                y: speaker.y,
                targetX: wave.x,
                targetY: wave.y,
                radius: 0,
                maxRadius: Math.min(dist * 0.8, 150),
                speed: 2.5,
                speakerId: speaker.id,
                noiseType: wave.type,
              });
            }
          });
        }
        
        return true;
      });
      
      // Draw cancel waves
      state.cancelWaves = state.cancelWaves.filter(wave => {
        wave.radius += wave.speed;
        if (wave.radius >= wave.maxRadius) return false;
        
        state.activeSpeakers.add(wave.speakerId);
        
        const opacity = Math.max(0, 1 - wave.radius / wave.maxRadius);
        const angle = Math.atan2(wave.targetY - wave.y, wave.targetX - wave.x);
        const spread = Math.PI / 2;
        
        const gradient = ctx.createRadialGradient(wave.x, wave.y, 0, wave.x, wave.y, wave.radius);
        gradient.addColorStop(0, `rgba(16, 185, 129, ${opacity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(16, 185, 129, ${opacity * 0.3})`);
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        
        ctx.beginPath();
        ctx.moveTo(wave.x, wave.y);
        ctx.arc(wave.x, wave.y, wave.radius, angle - spread, angle + spread);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, angle - spread, angle + spread);
        ctx.strokeStyle = `rgba(16, 185, 129, ${opacity * 0.9})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        return true;
      });
      
      // Draw students
      allStudents.forEach(student => {
        const isActive = state.activeStudents.has(student.id);
        
        if (isActive) {
          ctx.beginPath();
          ctx.arc(student.x, student.y, 18, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251, 146, 60, 0.3)';
          ctx.fill();
          
          const pulseRadius = 12 + Math.sin(state.tick * 0.1) * 3;
          ctx.beginPath();
          ctx.arc(student.x, student.y, pulseRadius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        ctx.beginPath();
        ctx.arc(student.x, student.y, 9, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#fb923c' : '#3b82f6';
        ctx.shadowColor = isActive ? '#fb923c' : '#3b82f6';
        ctx.shadowBlur = isActive ? 15 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Face
        ctx.fillStyle = isActive ? '#7c2d12' : '#1e3a8a';
        ctx.beginPath();
        ctx.arc(student.x - 2, student.y - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(student.x + 2, student.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw teacher
      const teacherActive = state.teacherSpeaking;
      if (teacherActive) {
        ctx.beginPath();
        ctx.arc(classroom.teacher.x, classroom.teacher.y, 25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
        ctx.fill();
      }
      
      ctx.beginPath();
      ctx.arc(classroom.teacher.x, classroom.teacher.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = teacherActive ? '#22c55e' : '#a855f7';
      ctx.shadowColor = teacherActive ? '#22c55e' : '#a855f7';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('T', classroom.teacher.x, classroom.teacher.y);
      
      // Draw speakers
      classroom.speakers.forEach(speaker => {
        const isActive = state.activeSpeakers.has(speaker.id);
        
        if (isActive) {
          ctx.beginPath();
          ctx.arc(speaker.x, speaker.y, 25 + Math.sin(state.tick * 0.15) * 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fill();
          
          for (let i = 0; i < 3; i++) {
            const ringRadius = 18 + i * 8 + Math.sin(state.tick * 0.1 + i) * 2;
            ctx.beginPath();
            ctx.arc(speaker.x, speaker.y, ringRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(16, 185, 129, ${0.4 - i * 0.1})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
        
        ctx.fillStyle = isActive ? '#10b981' : '#6366f1';
        ctx.fillRect(speaker.x - 15, speaker.y - 10, 30, 20);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = isActive ? '#064e3b' : '#312e81';
        ctx.fillRect(speaker.x - 8, speaker.y - 5, 4, 10);
        ctx.beginPath();
        ctx.moveTo(speaker.x - 4, speaker.y - 5);
        ctx.lineTo(speaker.x + 4, speaker.y - 8);
        ctx.lineTo(speaker.x + 4, speaker.y + 8);
        ctx.lineTo(speaker.x - 4, speaker.y + 5);
        ctx.closePath();
        ctx.fill();
        
        if (isActive) {
          ctx.strokeStyle = '#064e3b';
          ctx.lineWidth = 2;
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(speaker.x + 6, speaker.y, 3 + i * 3, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
          }
        }
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(speaker.label, speaker.x, speaker.y + 22);
      });
      
      // Draw microphones
      classroom.microphones.forEach(mic => {
        const listening = state.noiseWaves.some(w => {
          const dist = Math.sqrt(Math.pow(w.x - mic.x, 2) + Math.pow(w.y - mic.y, 2));
          return dist < w.radius + 50;
        });
        
        if (listening) {
          ctx.beginPath();
          ctx.arc(mic.x, mic.y, 15 + Math.sin(state.tick * 0.15) * 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fill();
        }
        
        ctx.beginPath();
        ctx.arc(mic.x, mic.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = listening ? '#ef4444' : '#dc2626';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = listening ? 15 : 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(mic.x - 3, mic.y - 6, 6, 8);
        ctx.fillRect(mic.x - 1, mic.y + 2, 2, 4);
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(mic.label, mic.x, mic.y + 22);
      });
      
      // Labels
      ctx.fillStyle = '#64748b';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('WINDOWS', 30, 55);
      ctx.fillText('DOOR', classroom.door.x - 10, classroom.door.y - 10);
      
      // Update stats
      setStats({
        activeStudents: state.activeStudents.size,
        activeSpeakers: state.activeSpeakers.size,
        cancelledWaves: cancelledCount,
      });
      
      // Update noise levels
      const studentNoise = state.activeStudents.size * 8 + Math.random() * 5;
      const outsideNoise = state.outsideNoiseActive ? 35 + Math.random() * 15 : 5 + Math.random() * 3;
      const overall = 25 + studentNoise * 0.5 + outsideNoise * 0.3 + Math.random() * 5;
      const reduction = systemActive ? 85 + Math.random() * 12 : 0;
      
      setNoiseLevels({
        overall: Math.min(100, overall),
        students: Math.min(100, studentNoise),
        outside: Math.min(100, outsideNoise),
        reduced: reduction,
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [systemActive, modes, allStudents]);

  const toggleMode = (mode) => {
    setModes(prev => {
      const newModes = { ...prev, [mode]: !prev[mode] };
      if (mode === 'testMode' && newModes.testMode) {
        newModes.groupWork = false;
        newModes.presentationMode = false;
      }
      if (mode === 'groupWork' && newModes.groupWork) {
        newModes.testMode = false;
      }
      return newModes;
    });
  };

  const getNotificationStyle = (type) => {
    switch(type) {
      case 'warning': return { bg: 'rgba(251, 191, 36, 0.15)', border: '#fbbf24', text: '#fbbf24' };
      case 'alert': return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' };
      case 'success': return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#10b981' };
      case 'action': return { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#6366f1' };
      case 'teacher': return { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#22c55e' };
      case 'external': return { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171' };
      case 'detect': return { bg: 'rgba(251, 146, 60, 0.15)', border: '#fb923c', text: '#fb923c' };
      case 'system': return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#10b981' };
      default: return { bg: 'rgba(100, 116, 139, 0.15)', border: '#64748b', text: '#94a3b8' };
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    addNotification('system', '🗑️', 'Notification log cleared', null);
  };

  return (
    <div style={styles.container}>
      {/* Control Panel */}
      <div style={styles.controlPanel}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>🎓</div>
          <div>
            <div style={styles.logoTitle}>ClassRoom ANC</div>
            <div style={styles.logoSubtitle}>AI-Powered Noise Control</div>
          </div>
        </div>

        {/* Power Button */}
        <div style={styles.section}>
          <button
            style={{
              ...styles.powerButton,
              background: systemActive 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: systemActive 
                ? '0 0 30px rgba(16, 185, 129, 0.4)' 
                : '0 0 30px rgba(239, 68, 68, 0.4)',
            }}
            onClick={() => {
              setSystemActive(!systemActive);
              addNotification(
                systemActive ? 'alert' : 'success',
                systemActive ? '🔴' : '🟢',
                systemActive ? 'System deactivated - Noise cancellation stopped' : 'System activated - AI monitoring started',
                null
              );
            }}
          >
            <span style={styles.powerIcon}>{systemActive ? '⏻' : '⭘'}</span>
            <span>{systemActive ? 'SYSTEM ACTIVE' : 'SYSTEM OFF'}</span>
          </button>
        </div>

        {/* Noise Control Modes */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>🎛️ Noise Control Modes</div>
          
          <ModeButton
            icon="👥"
            name="Student Chatter"
            desc="Cancel student conversations"
            active={modes.studentChatter}
            color="#fb923c"
            onClick={() => toggleMode('studentChatter')}
          />
          
          <ModeButton
            icon="🏠"
            name="Outside Noise"
            desc="Cancel external sounds"
            active={modes.outsideNoise}
            color="#ef4444"
            onClick={() => toggleMode('outsideNoise')}
          />
          
          <ModeButton
            icon="👨‍🏫"
            name="Teacher Voice"
            desc="Allow teacher to be heard"
            active={modes.teacherMode}
            color="#22c55e"
            onClick={() => toggleMode('teacherMode')}
          />
        </div>

        {/* Presets */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>⚡ Quick Presets</div>
          
          <PresetButton
            icon="📝"
            name="Test/Exam Mode"
            active={modes.testMode}
            onClick={() => toggleMode('testMode')}
          />
          
          <PresetButton
            icon="👨‍👩‍👧‍👦"
            name="Group Work"
            active={modes.groupWork}
            onClick={() => toggleMode('groupWork')}
          />
          
          <PresetButton
            icon="📊"
            name="Presentation"
            active={modes.presentationMode}
            onClick={() => toggleMode('presentationMode')}
          />
        </div>

        {/* AI Notification Log */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <div style={styles.sectionTitle}>🤖 AI Notification Log</div>
            <button onClick={clearNotifications} style={styles.clearBtn}>Clear</button>
          </div>
          
          <div style={styles.notificationContainer}>
            {notifications.slice(0, 15).map(notif => {
              const style = getNotificationStyle(notif.type);
              return (
                <div 
                  key={notif.id} 
                  style={{
                    ...styles.notification,
                    background: style.bg,
                    borderLeftColor: style.border,
                  }}
                >
                  <div style={styles.notificationHeader}>
                    <span style={styles.notificationIcon}>{notif.icon}</span>
                    <span style={styles.notificationTime}>{notif.time}</span>
                    {notif.area && (
                      <span style={{...styles.notificationArea, background: style.border}}>
                        {notif.area}
                      </span>
                    )}
                  </div>
                  <div style={{...styles.notificationMessage, color: style.text}}>
                    {notif.message}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={styles.legend}>
          <div style={styles.legendTitle}>Legend</div>
          <LegendItem color="#3b82f6" label="Student (Quiet)" />
          <LegendItem color="#fb923c" label="Student (Talking)" />
          <LegendItem color="#a855f7" label="Teacher" />
          <LegendItem color="#6366f1" label="Speaker (Idle)" />
          <LegendItem color="#10b981" label="Speaker (Active)" />
          <LegendItem color="#ef4444" label="Microphone" />
        </div>
      </div>

      {/* Main View */}
      <div style={styles.mainArea}>
        <div style={styles.header}>
          <h1 style={styles.title}>🏫 Classroom Real-Time View</h1>
          <div style={styles.statusContainer}>
            <div style={{
              ...styles.statusBadge,
              background: systemActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              borderColor: systemActive ? '#10b981' : '#ef4444',
            }}>
              <span style={{
                ...styles.statusDot,
                background: systemActive ? '#10b981' : '#ef4444',
                boxShadow: `0 0 10px ${systemActive ? '#10b981' : '#ef4444'}`,
              }} />
              {systemActive ? 'AI MONITORING' : 'OFFLINE'}
            </div>
            {modes.testMode && (
              <div style={{...styles.statusBadge, background: 'rgba(251, 191, 36, 0.2)', borderColor: '#fbbf24'}}>
                📝 EXAM MODE
              </div>
            )}
          </div>
        </div>
        
        <div style={styles.canvasWrapper}>
          <canvas
            ref={canvasRef}
            width={classroom.width}
            height={classroom.height}
            style={styles.canvas}
          />
        </div>

        {/* Bottom Stats */}
        <div style={styles.bottomStats}>
          <StatCard value={allStudents.length} label="Total Students" icon="👥" />
          <StatCard value={stats.activeStudents} label="Currently Talking" icon="🗣️" color="#fb923c" />
          <StatCard value={classroom.speakers.length} label="Speakers" icon="🔊" />
          <StatCard value={stats.activeSpeakers} label="Speakers Active" icon="✨" color="#10b981" />
          <StatCard value={classroom.microphones.length} label="Microphones" icon="🎤" />
          <StatCard value={`${noiseLevels.reduced.toFixed(0)}%`} label="Reduction Rate" icon="📉" color="#10b981" />
        </div>
      </div>
    </div>
  );
}

// Sub-components
const ModeButton = ({ icon, name, desc, active, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      width: '100%',
      padding: '14px 16px',
      background: active ? `${color}15` : 'rgba(30, 41, 59, 0.6)',
      border: `2px solid ${active ? color : 'transparent'}`,
      borderRadius: 12,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    }}
  >
    <span style={{ fontSize: 26 }}>{icon}</span>
    <div style={{ flex: 1, textAlign: 'left' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{name}</div>
      <div style={{ fontSize: 11, color: '#64748b' }}>{desc}</div>
    </div>
    <div style={{
      padding: '5px 12px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: active ? color : '#475569',
      color: '#fff',
    }}>{active ? 'ON' : 'OFF'}</div>
  </button>
);

const PresetButton = ({ icon, name, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '12px 16px',
      background: active ? 'rgba(99, 102, 241, 0.2)' : 'rgba(30, 41, 59, 0.4)',
      border: `1px solid ${active ? '#6366f1' : 'rgba(100, 116, 139, 0.2)'}`,
      borderRadius: 10,
      cursor: 'pointer',
      color: active ? '#fff' : '#94a3b8',
      fontSize: 13,
      fontWeight: 500,
    }}
  >
    <span>{icon}</span>
    {name}
    {active && <span style={{ marginLeft: 'auto', color: '#10b981' }}>●</span>}
  </button>
);

const LegendItem = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
    <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}50` }} />
    <span style={{ fontSize: 11, color: '#94a3b8' }}>{label}</span>
  </div>
);

const StatCard = ({ value, label, icon, color = '#fff' }) => (
  <div style={{
    flex: 1,
    padding: '16px 12px',
    background: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 12,
    textAlign: 'center',
    border: '1px solid rgba(100, 116, 139, 0.15)',
  }}>
    <div style={{ fontSize: 11, marginBottom: 6 }}>{icon}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
    <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{label}</div>
  </div>
);

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    fontFamily: "'Space Grotesk', -apple-system, sans-serif",
    color: '#fff',
  },
  controlPanel: {
    width: 380,
    background: 'rgba(15, 23, 42, 0.95)',
    borderRight: '1px solid rgba(100, 116, 139, 0.2)',
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    overflowY: 'auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 20,
    borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
  },
  logoIcon: {
    fontSize: 36,
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    padding: 12,
    borderRadius: 14,
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: 700,
    background: 'linear-gradient(90deg, #fff, #94a3b8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: 6,
  },
  clearBtn: {
    padding: '4px 10px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: 6,
    color: '#f87171',
    fontSize: 10,
    cursor: 'pointer',
  },
  powerButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
    padding: '18px 24px',
    border: 'none',
    borderRadius: 14,
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  powerIcon: {
    fontSize: 22,
  },
  notificationContainer: {
    maxHeight: 280,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingRight: 5,
  },
  notification: {
    padding: '10px 12px',
    borderRadius: 10,
    borderLeft: '4px solid',
    transition: 'all 0.2s ease',
  },
  notificationHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationIcon: {
    fontSize: 14,
  },
  notificationTime: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  notificationArea: {
    padding: '2px 8px',
    borderRadius: 10,
    fontSize: 9,
    fontWeight: 600,
    color: '#fff',
    marginLeft: 'auto',
  },
  notificationMessage: {
    fontSize: 11,
    lineHeight: 1.4,
  },
  legend: {
    padding: 16,
    background: 'rgba(30, 41, 59, 0.5)',
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    marginBottom: 12,
  },
  mainArea: {
    flex: 1,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 600,
    margin: 0,
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 24,
    fontSize: 13,
    fontWeight: 600,
    border: '1px solid',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
  },
  canvasWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 20,
    border: '1px solid rgba(100, 116, 139, 0.15)',
    padding: 24,
  },
  canvas: {
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
  },
  bottomStats: {
    display: 'flex',
    gap: 12,
  },
};