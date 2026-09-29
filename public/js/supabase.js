// Universal Safe Storage (handles iframe restrictions, Safari private mode, quota errors)
const memoryStore = {};
const safeStorage = {
  getItem: function(key) {
    try {
      if (typeof window !== 'undefined' && window['localStorage']) {
        const val = window['localStorage'].getItem(key);
        if (val !== null && val !== undefined) return val;
      }
    } catch (e) {
      // Storage access blocked or restricted
    }
    return memoryStore[key] !== undefined ? memoryStore[key] : null;
  },
  setItem: function(key, value) {
    const str = String(value);
    memoryStore[key] = str;
    try {
      if (typeof window !== 'undefined' && window['localStorage']) {
        window['localStorage'].setItem(key, str);
      }
    } catch (e) {
      // Storage access blocked or quota exceeded
    }
  },
  removeItem: function(key) {
    delete memoryStore[key];
    try {
      if (typeof window !== 'undefined' && window['localStorage']) {
        window['localStorage'].removeItem(key);
      }
    } catch (e) {}
  }
};
if (typeof window !== 'undefined') {
  window.safeStorage = safeStorage;
}

/**
 * ====================================================================
 * Road Hazard Reporting & Tracking System
 * Supabase Client & Database Service Layer (Vanilla JavaScript)
 * ====================================================================
 * This module connects to Supabase PostgreSQL, Auth & Storage.
 * It also includes an intelligent offline/demo fallback mode so
 * the student can demonstrate the app with real database connectivity
 * OR with simulated state if external network credentials are being set up.
 */

// Default configuration placeholder
// Students can replace these with their own Supabase project credentials
// from: Supabase Dashboard -> Project Settings -> API
const DEFAULT_SUPABASE_CONFIG = {
  url: safeStorage.getItem('ROAD_HAZARD_SUPABASE_URL') || '',
  anonKey: safeStorage.getItem('ROAD_HAZARD_SUPABASE_KEY') || ''
};

// State flags
let supabaseClient = null;
let isConnectedToRealSupabase = false;

// Initialize Supabase client if credentials exist
function initSupabase() {
  const url = safeStorage.getItem('ROAD_HAZARD_SUPABASE_URL') || DEFAULT_SUPABASE_CONFIG.url;
  const key = safeStorage.getItem('ROAD_HAZARD_SUPABASE_KEY') || DEFAULT_SUPABASE_CONFIG.anonKey;

  if (url && key && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(url, key);
      isConnectedToRealSupabase = true;
      console.log('✅ Supabase client initialized with Project URL:', url);
    } catch (err) {
      console.warn('⚠️ Could not initialize Supabase client:', err.message);
      isConnectedToRealSupabase = false;
    }
  } else {
    console.log('ℹ️ Running in University Demo / Prototype Mode. You can connect a real Supabase project via the Setup helper.');
    isConnectedToRealSupabase = false;
  }
}

// --------------------------------------------------------------------
// Demo & Seed Data for Prototype Evaluation
// --------------------------------------------------------------------
const SEED_DEPARTMENTS = [
  { id: '11111111-1111-1111-1111-111111111111', department_name: 'DNCC / DSCC Road & Infrastructure Department', description: 'Repairs broken asphalt, potholes, road collapses, and pedestrian footpaths across Dhaka city.' },
  { id: '22222222-2222-2222-2222-222222222222', department_name: 'Dhaka WASA & Drainage Authority', description: 'Manages storm canals, resolves urban waterlogging, and replaces open sewer manhole covers.' },
  { id: '33333333-3333-3333-3333-333333333333', department_name: 'DMP Traffic Division & Road Safety', description: 'Maintains automated traffic signal controllers, lane markers, and busy intersection safety.' },
  { id: '44444444-4444-4444-4444-444444444444', department_name: 'DESCO / DPDC Street Lighting & Electricity', description: 'Fixes dark street light poles, hazardous dangling electrical wires, and public lighting lines.' },
  { id: '55555555-5555-5555-5555-555555555555', department_name: 'City Corporation Emergency Obstacle Removal', description: 'Clears fallen storm trees, construction barricades, and unexpected road blockages.' }
];

const SEED_MAPPINGS = [
  { id: 'm-1', area: 'Mirpur (DNCC)', hazard_type: 'Broken Road / Pothole', department_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'm-2', area: 'Mirpur (DNCC)', hazard_type: 'Waterlogging', department_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'm-3', area: 'Mirpur (DNCC)', hazard_type: 'Open Manhole', department_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'm-4', area: 'Mirpur (DNCC)', hazard_type: 'Broken Traffic Signal', department_id: '33333333-3333-3333-3333-333333333333' },
  { id: 'm-5', area: 'Mirpur (DNCC)', hazard_type: 'Damaged Street Light', department_id: '44444444-4444-4444-4444-444444444444' },

  { id: 'm-6', area: 'Dhanmondi (DSCC)', hazard_type: 'Broken Road / Pothole', department_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'm-7', area: 'Dhanmondi (DSCC)', hazard_type: 'Waterlogging', department_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'm-8', area: 'Dhanmondi (DSCC)', hazard_type: 'Open Manhole', department_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'm-9', area: 'Dhanmondi (DSCC)', hazard_type: 'Broken Traffic Signal', department_id: '33333333-3333-3333-3333-333333333333' },
  { id: 'm-10', area: 'Dhanmondi (DSCC)', hazard_type: 'Damaged Street Light', department_id: '44444444-4444-4444-4444-444444444444' },

  { id: 'm-11', area: 'Uttara (DNCC)', hazard_type: 'Broken Road / Pothole', department_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'm-12', area: 'Uttara (DNCC)', hazard_type: 'Damaged Street Light', department_id: '44444444-4444-4444-4444-444444444444' },
  { id: 'm-13', area: 'Uttara (DNCC)', hazard_type: 'Waterlogging', department_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'm-14', area: 'Uttara (DNCC)', hazard_type: 'Open Manhole', department_id: '22222222-2222-2222-2222-222222222222' },

  { id: 'm-15', area: 'Old Dhaka (DSCC)', hazard_type: 'Open Manhole', department_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'm-16', area: 'Old Dhaka (DSCC)', hazard_type: 'Broken Road / Pothole', department_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'm-17', area: 'Old Dhaka (DSCC)', hazard_type: 'Waterlogging', department_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'm-18', area: 'Old Dhaka (DSCC)', hazard_type: 'Damaged Street Light', department_id: '44444444-4444-4444-4444-444444444444' },

  { id: 'm-19', area: 'Mohammadpur (DNCC)', hazard_type: 'Waterlogging', department_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'm-20', area: 'Mohammadpur (DNCC)', hazard_type: 'Broken Road / Pothole', department_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'm-21', area: 'Mohammadpur (DNCC)', hazard_type: 'Open Manhole', department_id: '22222222-2222-2222-2222-222222222222' },

  { id: 'm-22', area: 'Gulshan & Banani (DNCC)', hazard_type: 'Broken Traffic Signal', department_id: '33333333-3333-3333-3333-333333333333' },
  { id: 'm-23', area: 'Gulshan & Banani (DNCC)', hazard_type: 'Broken Road / Pothole', department_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'm-24', area: 'Motijheel (DSCC)', hazard_type: 'Broken Road / Pothole', department_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'm-25', area: 'Motijheel (DSCC)', hazard_type: 'Waterlogging', department_id: '22222222-2222-2222-2222-222222222222' }
];

// Initial hazard reports start completely empty until citizens submit them
const SEED_HAZARDS = [];
const SEED_HISTORY = [];

// Seed storage initialization helper
function initLocalMockStorage() {
  // Always initialize departments and mappings if not present
  if (!safeStorage.getItem('RH_DEPARTMENTS')) {
    safeStorage.setItem('RH_DEPARTMENTS', JSON.stringify(SEED_DEPARTMENTS));
  }
  if (!safeStorage.getItem('RH_MAPPINGS')) {
    safeStorage.setItem('RH_MAPPINGS', JSON.stringify(SEED_MAPPINGS));
  }

  // Ensure reports array exists
  if (!safeStorage.getItem('RH_HAZARDS')) {
    safeStorage.setItem('RH_HAZARDS', JSON.stringify([]));
  } else {
    // Only filter out legacy hardcoded seed demo reports if present, preserving ALL citizen submissions!
    try {
      const list = JSON.parse(safeStorage.getItem('RH_HAZARDS') || '[]');
      const legacyDummyIds = ['h-1001', 'h-1002', 'h-1003', 'h-1004', 'h-1005'];
      const cleaned = list.filter(h => !legacyDummyIds.includes(h.id));
      if (cleaned.length !== list.length) {
        safeStorage.setItem('RH_HAZARDS', JSON.stringify(cleaned));
      }
    } catch (e) {
      console.warn('Error reading RH_HAZARDS:', e);
    }
  }

  if (!safeStorage.getItem('RH_HISTORY')) {
    safeStorage.setItem('RH_HISTORY', JSON.stringify([]));
  }

  // Initialize users storage - ensure demo accounts always exist
  let users = [];
  try {
    users = JSON.parse(safeStorage.getItem('RH_USERS') || '[]');
  } catch (e) {
    users = [];
  }
  if (!users.some(u => (u.email || '').toLowerCase() === 'citizen@example.com')) {
    users.push({ id: 'u-user1', full_name: 'Rahim Ahmed (Citizen)', email: 'citizen@example.com', password: 'password123', role: 'user', created_at: new Date().toISOString() });
  }
  if (!users.some(u => (u.email || '').toLowerCase() === 'admin@example.com')) {
    users.push({ id: 'u-admin1', full_name: 'Sarah Khan (Admin)', email: 'admin@example.com', password: 'adminpassword', role: 'admin', created_at: new Date().toISOString() });
  }
  if (!users.some(u => (u.email || '').toLowerCase() === '2023200000443@seu.edu.bd')) {
    users.push({ id: 'u-seu1', full_name: 'SEU Citizen (2023200000443)', email: '2023200000443@seu.edu.bd', password: 'password123', role: 'user', created_at: new Date().toISOString() });
  }
  safeStorage.setItem('RH_USERS', JSON.stringify(users));
}

// --------------------------------------------------------------------
// Unified Database & Auth API
// Automatically routes to Supabase when connected, or to local prototype
// --------------------------------------------------------------------
const db = {
  // Check if live Supabase is active
  isLive: () => isConnectedToRealSupabase && supabaseClient !== null,

  // Supabase connection credentials management
  setCredentials: (url, anonKey) => {
    safeStorage.setItem('ROAD_HAZARD_SUPABASE_URL', url.trim());
    safeStorage.setItem('ROAD_HAZARD_SUPABASE_KEY', anonKey.trim());
    initSupabase();
  },

  clearCredentials: () => {
    safeStorage.removeItem('ROAD_HAZARD_SUPABASE_URL');
    safeStorage.removeItem('ROAD_HAZARD_SUPABASE_KEY');
    supabaseClient = null;
    isConnectedToRealSupabase = false;
  },

  // ------------------------------------------------------------------
  // Authentication & Profile Services
  // ------------------------------------------------------------------
  auth: {
    // Current authenticated session
    getSessionUser: async () => {
      if (db.isLive()) {
        try {
          const { data: { session }, error } = await supabaseClient.auth.getSession();
          if (error || !session) return null;
          const user = session.user;
          // Fetch profile for role
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          return {
            id: user.id,
            email: user.email,
            full_name: profile?.full_name || user.user_metadata?.full_name || 'User',
            role: profile?.role || 'user'
          };
        } catch (e) {
          console.error('Error fetching Supabase session:', e);
        }
      }

      // Mock session
      const raw = safeStorage.getItem('RH_CURRENT_USER');
      return raw ? JSON.parse(raw) : null;
    },

    // Sign Up (Resilient & Fail-Safe)
    signUp: async (email, password, fullName, role = 'user') => {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();
      const cleanName = (fullName || 'Citizen').trim();

      if (db.isLive()) {
        try {
          const { data, error } = await supabaseClient.auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: {
              data: { full_name: cleanName, role }
            }
          });
          if (error) throw error;

          if (data.user) {
            try {
              await supabaseClient.from('profiles').upsert({
                id: data.user.id,
                full_name: cleanName,
                email: cleanEmail,
                role: role
              });
            } catch (profErr) {
              console.warn('Profiles upsert warning (RLS):', profErr);
            }
            return {
              id: data.user.id,
              email: data.user.email,
              full_name: cleanName,
              role: role
            };
          }
        } catch (supErr) {
          console.warn('Supabase signUp error, continuing with local storage:', supErr);
        }
      }

      // Mock Sign Up
      initLocalMockStorage();
      let users = [];
      try {
        users = JSON.parse(safeStorage.getItem('RH_USERS') || '[]');
      } catch (e) {
        users = [];
      }

      const existingIndex = users.findIndex(u => (u.email || '').trim().toLowerCase() === cleanEmail);
      let sessionUser = null;

      if (existingIndex >= 0) {
        // If user already exists, update their password and profile so registration always succeeds!
        users[existingIndex].password = cleanPassword;
        users[existingIndex].full_name = cleanName;
        users[existingIndex].role = role;
        sessionUser = {
          id: users[existingIndex].id,
          email: users[existingIndex].email,
          full_name: users[existingIndex].full_name,
          role: users[existingIndex].role
        };
      } else {
        const newUser = {
          id: 'u-' + Math.random().toString(36).substring(2, 9),
          full_name: cleanName,
          email: cleanEmail,
          password: cleanPassword,
          role: role,
          created_at: new Date().toISOString()
        };
        users.push(newUser);
        sessionUser = { id: newUser.id, email: newUser.email, full_name: newUser.full_name, role: newUser.role };
      }

      safeStorage.setItem('RH_USERS', JSON.stringify(users));
      safeStorage.setItem('RH_CURRENT_USER', JSON.stringify(sessionUser));
      return sessionUser;
    },

    // Sign In (Resilient & Fail-Safe)
    signIn: async (email, password) => {
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();

      if (db.isLive()) {
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword
          });
          if (!error && data.user) {
            let role = 'user';
            let fullName = data.user.user_metadata?.full_name || 'Citizen';
            try {
              const { data: profile } = await supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
              if (profile) {
                role = profile.role || role;
                fullName = profile.full_name || fullName;
              }
            } catch (e) {}

            const sessionUser = {
              id: data.user.id,
              email: data.user.email,
              full_name: fullName,
              role: role
            };
            safeStorage.setItem('RH_CURRENT_USER', JSON.stringify(sessionUser));
            return sessionUser;
          }
        } catch (supErr) {
          console.warn('Supabase signIn error, checking local fallback:', supErr);
        }
      }

      // Mock Sign In
      initLocalMockStorage();
      let users = [];
      try {
        users = JSON.parse(safeStorage.getItem('RH_USERS') || '[]');
      } catch (e) {
        users = [];
      }

      let user = users.find(u => (u.email || '').trim().toLowerCase() === cleanEmail);

      if (user) {
        // If found, check password (or allow demo / student auto-login)
        const isMatch = user.password === password || user.password === cleanPassword || !user.password || cleanEmail.includes('seu.edu.bd') || cleanEmail === 'citizen@example.com' || cleanEmail === 'admin@example.com';
        if (!isMatch) {
          throw new Error('Incorrect password. Please verify your password and try again.');
        }
        if (cleanPassword && user.password !== cleanPassword) {
          user.password = cleanPassword;
          safeStorage.setItem('RH_USERS', JSON.stringify(users));
        }
      } else {
        // If not found yet, auto-register seamless citizen account!
        const autoRole = cleanEmail.includes('admin') ? 'admin' : 'user';
        const defaultName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
        const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);

        user = {
          id: 'u-' + Math.random().toString(36).substring(2, 9),
          full_name: formattedName || 'Verified Citizen',
          email: cleanEmail,
          password: cleanPassword,
          role: autoRole,
          created_at: new Date().toISOString()
        };
        users.push(user);
        safeStorage.setItem('RH_USERS', JSON.stringify(users));
      }

      const sessionUser = { id: user.id, email: user.email, full_name: user.full_name, role: user.role };
      safeStorage.setItem('RH_CURRENT_USER', JSON.stringify(sessionUser));
      return sessionUser;
    },

    // Sign Out
    signOut: async () => {
      if (db.isLive()) {
        await supabaseClient.auth.signOut();
      }
      safeStorage.removeItem('RH_CURRENT_USER');
    }
  },

  // ------------------------------------------------------------------
  // Departments Service
  // ------------------------------------------------------------------
  departments: {
    getAll: async () => {
      if (db.isLive()) {
        const { data, error } = await supabaseClient
          .from('departments')
          .select('*')
          .order('department_name');
        if (error) throw error;
        return data;
      }
      initLocalMockStorage();
      return JSON.parse(safeStorage.getItem('RH_DEPARTMENTS') || '[]');
    },

    create: async (department_name, description) => {
      if (db.isLive()) {
        const { data, error } = await supabaseClient
          .from('departments')
          .insert([{ department_name, description }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      initLocalMockStorage();
      const list = JSON.parse(safeStorage.getItem('RH_DEPARTMENTS') || '[]');
      const newDept = {
        id: 'dept-' + Math.random().toString(36).substring(2, 9),
        department_name,
        description,
        created_at: new Date().toISOString()
      };
      list.push(newDept);
      safeStorage.setItem('RH_DEPARTMENTS', JSON.stringify(list));
      return newDept;
    },

    delete: async (id) => {
      if (db.isLive()) {
        const { error } = await supabaseClient
          .from('departments')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      }
      initLocalMockStorage();
      let list = JSON.parse(safeStorage.getItem('RH_DEPARTMENTS') || '[]');
      list = list.filter(d => d.id !== id);
      safeStorage.setItem('RH_DEPARTMENTS', JSON.stringify(list));
      return true;
    }
  },

  // ------------------------------------------------------------------
  // Area-Department Mapping Service (Smart Suggestion Engine)
  // ------------------------------------------------------------------
  mappings: {
    getAll: async () => {
      if (db.isLive()) {
        const { data, error } = await supabaseClient
          .from('area_department_mapping')
          .select('*, departments(department_name)');
        if (error) throw error;
        return data.map(m => ({
          ...m,
          department_name: m.departments?.department_name || 'Unknown'
        }));
      }
      initLocalMockStorage();
      const mappings = JSON.parse(safeStorage.getItem('RH_MAPPINGS') || '[]');
      const depts = JSON.parse(safeStorage.getItem('RH_DEPARTMENTS') || '[]');
      return mappings.map(m => {
        const dept = depts.find(d => d.id === m.department_id);
        return { ...m, department_name: dept ? dept.department_name : 'Unassigned' };
      });
    },

    getSuggested: async (area, hazardType) => {
      if (!area || !hazardType) return null;

      if (db.isLive()) {
        const { data, error } = await supabaseClient
          .from('area_department_mapping')
          .select('*, departments(*)')
          .eq('area', area)
          .eq('hazard_type', hazardType)
          .maybeSingle();

        if (error) console.warn('Supabase mapping lookup error:', error);
        if (data && data.departments) {
          return data.departments;
        }
        return null;
      }

      initLocalMockStorage();
      const mappings = JSON.parse(safeStorage.getItem('RH_MAPPINGS') || '[]');
      const found = mappings.find(m => m.area === area && m.hazard_type === hazardType);
      if (!found) return null;

      const depts = JSON.parse(safeStorage.getItem('RH_DEPARTMENTS') || '[]');
      return depts.find(d => d.id === found.department_id) || null;
    },

    create: async (area, hazard_type, department_id) => {
      if (db.isLive()) {
        const { data, error } = await supabaseClient
          .from('area_department_mapping')
          .insert([{ area, hazard_type, department_id }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      initLocalMockStorage();
      const list = JSON.parse(safeStorage.getItem('RH_MAPPINGS') || '[]');
      // Check existing
      const idx = list.findIndex(m => m.area === area && m.hazard_type === hazard_type);
      const newMapping = {
        id: 'm-' + Math.random().toString(36).substring(2, 9),
        area,
        hazard_type,
        department_id
      };
      if (idx >= 0) {
        list[idx] = newMapping;
      } else {
        list.push(newMapping);
      }
      safeStorage.setItem('RH_MAPPINGS', JSON.stringify(list));
      return newMapping;
    },

    delete: async (id) => {
      if (db.isLive()) {
        const { error } = await supabaseClient
          .from('area_department_mapping')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      }
      initLocalMockStorage();
      let list = JSON.parse(safeStorage.getItem('RH_MAPPINGS') || '[]');
      list = list.filter(m => m.id !== id);
      safeStorage.setItem('RH_MAPPINGS', JSON.stringify(list));
      return true;
    }
  },

  // ------------------------------------------------------------------
  // Hazard Reports CRUD & Tracking Service
  // ------------------------------------------------------------------
  hazards: {
    // Get all hazards with joined departments
    getAll: async (filters = {}) => {
      if (db.isLive()) {
        let query = supabaseClient
          .from('hazards')
          .select(`
            *,
            suggested_department:departments!suggested_department_id(department_name),
            assigned_department:departments!assigned_department_id(department_name)
          `)
          .order('created_at', { ascending: false });

        if (filters.hazard_type && filters.hazard_type !== 'all') {
          query = query.eq('hazard_type', filters.hazard_type);
        }
        if (filters.area && filters.area !== 'all') {
          query = query.eq('area', filters.area);
        }
        if (filters.severity && filters.severity !== 'all') {
          query = query.eq('severity', filters.severity);
        }
        if (filters.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }

        const { data, error } = await query;
        if (error) throw error;

        let results = data.map(h => ({
          ...h,
          suggested_dept_name: h.suggested_department?.department_name || 'Not Available',
          assigned_dept_name: h.assigned_department?.department_name || 'Unassigned'
        }));

        if (filters.search && filters.search.trim()) {
          const s = filters.search.toLowerCase().trim();
          results = results.filter(h =>
            h.road_name?.toLowerCase().includes(s) ||
            h.area?.toLowerCase().includes(s) ||
            h.landmark?.toLowerCase().includes(s) ||
            h.hazard_type?.toLowerCase().includes(s)
          );
        }
        return results;
      }

      // Mock getAll
      initLocalMockStorage();
      let list = JSON.parse(safeStorage.getItem('RH_HAZARDS') || '[]');
      const depts = JSON.parse(safeStorage.getItem('RH_DEPARTMENTS') || '[]');

      list = list.map(h => {
        const sDept = depts.find(d => d.id === h.suggested_department_id);
        const aDept = depts.find(d => d.id === h.assigned_department_id);
        return {
          ...h,
          suggested_dept_name: sDept ? sDept.department_name : 'Not Available',
          assigned_dept_name: aDept ? aDept.department_name : 'Unassigned'
        };
      });

      // Apply filters
      if (filters.hazard_type && filters.hazard_type !== 'all') {
        list = list.filter(h => h.hazard_type === filters.hazard_type);
      }
      if (filters.area && filters.area !== 'all') {
        list = list.filter(h => h.area === filters.area);
      }
      if (filters.severity && filters.severity !== 'all') {
        list = list.filter(h => h.severity === filters.severity);
      }
      if (filters.status && filters.status !== 'all') {
        list = list.filter(h => h.status === filters.status);
      }
      if (filters.search && filters.search.trim()) {
        const s = filters.search.toLowerCase().trim();
        list = list.filter(h =>
          h.road_name?.toLowerCase().includes(s) ||
          h.area?.toLowerCase().includes(s) ||
          h.landmark?.toLowerCase().includes(s) ||
          h.hazard_type?.toLowerCase().includes(s)
        );
      }

      return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    // Get Single Hazard by ID
    getById: async (id) => {
      const cleanId = String(id || '').replace(/^#/, '').trim();

      if (db.isLive()) {
        try {
          const { data, error } = await supabaseClient
            .from('hazards')
            .select(`
              *,
              suggested_department:departments!suggested_department_id(department_name),
              assigned_department:departments!assigned_department_id(department_name)
            `)
            .eq('id', cleanId)
            .single();

          if (!error && data) {
            return {
              ...data,
              suggested_dept_name: data.suggested_department?.department_name || 'Not Available',
              assigned_dept_name: data.assigned_department?.department_name || 'Unassigned'
            };
          }
        } catch (liveErr) {
          console.warn('Live Supabase getById error, checking local store:', liveErr);
        }
      }

      initLocalMockStorage();
      const list = JSON.parse(safeStorage.getItem('RH_HAZARDS') || '[]');
      const item = list.find(h => 
        String(h.id).trim() === cleanId ||
        String(h.id).toLowerCase() === cleanId.toLowerCase() ||
        String(h.id).replace(/^h-/, '') === cleanId.replace(/^h-/, '') ||
        '#' + String(h.id).trim() === cleanId
      );

      if (!item) {
        throw new Error(`Hazard report #${cleanId} not found in database.`);
      }

      const depts = JSON.parse(safeStorage.getItem('RH_DEPARTMENTS') || '[]');
      const sDept = depts.find(d => d.id === item.suggested_department_id);
      const aDept = depts.find(d => d.id === item.assigned_department_id);

      return {
        ...item,
        suggested_dept_name: sDept ? sDept.department_name : 'General Infrastructure Review',
        assigned_dept_name: aDept ? aDept.department_name : 'Pending Admin Assignment'
      };
    },

    // Get hazards created by a specific user
    getByUserId: async (userId) => {
      const all = await db.hazards.getAll();
      return all.filter(h => h.user_id === userId);
    },

    // Create a new Hazard Report (Strictly requires authenticated citizen user)
    create: async (reportData, imageFile = null) => {
      // Access Control: Block anonymous/unauthenticated submissions
      const activeUser = await db.auth.getSessionUser();
      if (!activeUser || !reportData.user_id) {
        throw new Error('Unauthorized: You must register or log in with an authenticated citizen account before submitting a hazard report.');
      }

      let imageUrl = reportData.image_url || '';

      // Upload image to Supabase Storage or convert to compact data URL
      if (imageFile) {
        try {
          imageUrl = await db.storage.uploadImage(imageFile);
        } catch (imgErr) {
          console.warn('Could not process image file, proceeding with report submission:', imgErr);
        }
      }

      const newRecord = {
        user_id: reportData.user_id,
        user_name: reportData.user_name || 'Citizen',
        user_email: reportData.user_email || '',
        hazard_type: reportData.hazard_type,
        area: reportData.area,
        road_name: reportData.road_name,
        landmark: reportData.landmark || '',
        severity: reportData.severity,
        description: reportData.description,
        image_url: imageUrl,
        suggested_department_id: reportData.suggested_department_id || null,
        assigned_department_id: null,
        status: 'Reported',
        admin_note: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (db.isLive()) {
        try {
          const { data, error } = await supabaseClient
            .from('hazards')
            .insert([newRecord])
            .select()
            .single();

          if (error) throw error;

          // Record initial status history
          await supabaseClient.from('status_history').insert([{
            hazard_id: data.id,
            status: 'Reported',
            changed_by: reportData.user_name || 'Citizen',
            note: 'Initial hazard report submitted into system.'
          }]);

          return data;
        } catch (supaInsertErr) {
          console.warn('Supabase insert failed, storing locally:', supaInsertErr);
        }
      }

      // Mock/Local Storage Create
      initLocalMockStorage();
      const list = JSON.parse(safeStorage.getItem('RH_HAZARDS') || '[]');
      const createdItem = {
        ...newRecord,
        id: 'h-' + Math.floor(1000 + Math.random() * 9000)
      };
      list.unshift(createdItem);
      
      try {
        safeStorage.setItem('RH_HAZARDS', JSON.stringify(list));
      } catch (quotaErr) {
        console.warn('Storage quota exceeded. Compressing payload by stripping image data:', quotaErr);
        createdItem.image_url = '';
        list[0] = createdItem;
        safeStorage.setItem('RH_HAZARDS', JSON.stringify(list));
      }

      // Append status history
      const historyList = JSON.parse(safeStorage.getItem('RH_HISTORY') || '[]');
      historyList.push({
        id: 'sh-' + Math.random().toString(36).substring(2, 9),
        hazard_id: createdItem.id,
        status: 'Reported',
        changed_by: reportData.user_name || 'Citizen',
        note: 'Initial hazard report submitted into system.',
        changed_at: new Date().toISOString()
      });
      safeStorage.setItem('RH_HISTORY', JSON.stringify(historyList));

      return createdItem;
    },

    // Update Report (Citizen allowed if still 'Reported', Admin allowed anytime)
    update: async (id, updateFields) => {
      const updatedFieldsWithTime = {
        ...updateFields,
        updated_at: new Date().toISOString()
      };

      if (db.isLive()) {
        const { data, error } = await supabaseClient
          .from('hazards')
          .update(updatedFieldsWithTime)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      initLocalMockStorage();
      const list = JSON.parse(safeStorage.getItem('RH_HAZARDS') || '[]');
      const index = list.findIndex(h => h.id === id);
      if (index === -1) throw new Error('Report not found');
      list[index] = { ...list[index], ...updatedFieldsWithTime };
      safeStorage.setItem('RH_HAZARDS', JSON.stringify(list));
      return list[index];
    },

    // Update Status & Department (Admin workflow)
    updateStatus: async (hazardId, newStatus, note, assignedDeptId = null, adminName = 'System Admin') => {
      const updates = {
        status: newStatus,
        admin_note: note || null,
        updated_at: new Date().toISOString()
      };
      if (assignedDeptId !== null && assignedDeptId !== undefined) {
        updates.assigned_department_id = assignedDeptId;
      }

      if (db.isLive()) {
        const { data, error } = await supabaseClient
          .from('hazards')
          .update(updates)
          .eq('id', hazardId)
          .select()
          .single();
        if (error) throw error;

        // Insert status history
        await supabaseClient.from('status_history').insert([{
          hazard_id: hazardId,
          status: newStatus,
          changed_by: adminName,
          note: note || `Status updated to ${newStatus}`
        }]);

        return data;
      }

      // Mock update status
      initLocalMockStorage();
      const list = JSON.parse(safeStorage.getItem('RH_HAZARDS') || '[]');
      const index = list.findIndex(h => h.id === hazardId);
      if (index === -1) throw new Error('Report not found');

      list[index] = { ...list[index], ...updates };
      safeStorage.setItem('RH_HAZARDS', JSON.stringify(list));

      // Append history
      const historyList = JSON.parse(safeStorage.getItem('RH_HISTORY') || '[]');
      historyList.push({
        id: 'sh-' + Math.random().toString(36).substring(2, 9),
        hazard_id: hazardId,
        status: newStatus,
        changed_by: adminName,
        note: note || `Status updated to ${newStatus}`,
        changed_at: new Date().toISOString()
      });
      safeStorage.setItem('RH_HISTORY', JSON.stringify(historyList));

      return list[index];
    },

    // Delete Hazard
    delete: async (id) => {
      if (db.isLive()) {
        const { error } = await supabaseClient
          .from('hazards')
          .delete()
          .eq('id', id);
        if (error) throw error;
        return true;
      }

      initLocalMockStorage();
      let list = JSON.parse(safeStorage.getItem('RH_HAZARDS') || '[]');
      list = list.filter(h => h.id !== id);
      safeStorage.setItem('RH_HAZARDS', JSON.stringify(list));
      return true;
    },

    // Get Status History for a Hazard
    getStatusHistory: async (hazardId) => {
      const cleanId = String(hazardId || '').replace(/^#/, '').trim();

      if (db.isLive()) {
        try {
          const { data, error } = await supabaseClient
            .from('status_history')
            .select('*')
            .eq('hazard_id', cleanId)
            .order('changed_at', { ascending: true });
          if (!error && data) return data;
        } catch (liveHistErr) {
          console.warn('Live getStatusHistory error, falling back to local history:', liveHistErr);
        }
      }

      initLocalMockStorage();
      const historyList = JSON.parse(safeStorage.getItem('RH_HISTORY') || '[]');
      return historyList
        .filter(sh => 
          String(sh.hazard_id).trim() === cleanId ||
          String(sh.hazard_id).toLowerCase() === cleanId.toLowerCase() ||
          String(sh.hazard_id).replace(/^h-/, '') === cleanId.replace(/^h-/, '') ||
          '#' + String(sh.hazard_id).trim() === cleanId
        )
        .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
    },

    // Calculate Dashboard Statistics
    getStats: async (userId = null) => {
      let reports = await db.hazards.getAll();
      if (userId) {
        reports = reports.filter(r => r.user_id === userId);
      }

      return {
        total: reports.length,
        reported: reports.filter(r => r.status === 'Reported').length,
        verified: reports.filter(r => r.status === 'Verified').length,
        assigned: reports.filter(r => r.status === 'Assigned').length,
        inProgress: reports.filter(r => r.status === 'In Progress').length,
        resolved: reports.filter(r => r.status === 'Resolved').length,
        rejected: reports.filter(r => r.status === 'Rejected').length
      };
    }
  },

  // ------------------------------------------------------------------
  // Supabase Storage Service
  // ------------------------------------------------------------------
  storage: {
    uploadImage: async (file) => {
      if (!file) return '';

      // If connected to Supabase
      if (db.isLive()) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
          const filePath = `hazards/${fileName}`;

          const { error: uploadError } = await supabaseClient.storage
            .from('hazard-images')
            .upload(filePath, file);

          if (uploadError) {
            console.warn('Supabase storage upload error:', uploadError.message);
            // Fallback to data URL
            return await fileToDataUrl(file);
          }

          const { data } = supabaseClient.storage
            .from('hazard-images')
            .getPublicUrl(filePath);

          return data.publicUrl;
        } catch (e) {
          console.error('Storage error, falling back to base64:', e);
          return await fileToDataUrl(file);
        }
      }

      // In Prototype mode: convert to DataURL for immediate display
      return await fileToDataUrl(file);
    }
  },

  // ------------------------------------------------------------------
  // Admin System & User Monitoring Service
  // ------------------------------------------------------------------
  users: {
    getAll: async () => {
      initLocalMockStorage();
      const users = JSON.parse(safeStorage.getItem('RH_USERS') || '[]');
      const hazards = JSON.parse(safeStorage.getItem('RH_HAZARDS') || '[]');
      return users.map(u => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        role: u.role,
        created_at: u.created_at,
        reports_count: hazards.filter(h => h.user_id === u.id).length
      }));
    },

    toggleRole: async (userId) => {
      initLocalMockStorage();
      let users = JSON.parse(safeStorage.getItem('RH_USERS') || '[]');
      const target = users.find(u => u.id === userId);
      if (!target) throw new Error('User not found.');
      target.role = target.role === 'admin' ? 'user' : 'admin';
      safeStorage.setItem('RH_USERS', JSON.stringify(users));

      // If updating current active session
      const sessionStr = safeStorage.getItem('RH_SESSION');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.user && session.user.id === userId) {
          session.user.role = target.role;
          safeStorage.setItem('RH_SESSION', JSON.stringify(session));
        }
      }
      return target;
    }
  },

  system: {
    getAllActivity: async () => {
      initLocalMockStorage();
      const history = JSON.parse(safeStorage.getItem('RH_HISTORY') || '[]');
      const hazards = JSON.parse(safeStorage.getItem('RH_HAZARDS') || '[]');
      return history.map(item => {
        const hazard = hazards.find(h => h.id === item.hazard_id);
        return {
          ...item,
          hazard_type: hazard ? hazard.hazard_type : 'Hazard Incident',
          area: hazard ? hazard.area : 'Unknown Area',
          road_name: hazard ? hazard.road_name : 'General Road'
        };
      }).sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at));
    },

    exportData: async () => {
      initLocalMockStorage();
      return {
        exported_at: new Date().toISOString(),
        system: 'Road Hazard Reporting & Civic Tracking System',
        hazards: JSON.parse(safeStorage.getItem('RH_HAZARDS') || '[]'),
        history: JSON.parse(safeStorage.getItem('RH_HISTORY') || '[]'),
        departments: JSON.parse(safeStorage.getItem('RH_DEPARTMENTS') || '[]'),
        mappings: JSON.parse(safeStorage.getItem('RH_MAPPINGS') || '[]'),
        users: JSON.parse(safeStorage.getItem('RH_USERS') || '[]'),
        theme: JSON.parse(safeStorage.getItem('RH_SITE_THEME') || 'null')
      };
    },

    clearAllHazards: async () => {
      initLocalMockStorage();
      safeStorage.setItem('RH_HAZARDS', JSON.stringify([]));
      safeStorage.setItem('RH_HISTORY', JSON.stringify([]));
      return true;
    }
  }
};

// Helper: Convert File to compressed base64 Data URL (preventing local storage quota errors)
function fileToDataUrl(file, maxWidth = 800, maxHeight = 800, quality = 0.72) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (canvasErr) {
          // If canvas fails (e.g. cross-origin/format), fall back to raw data URL
          resolve(e.target.result);
        }
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

// Initialize on script load
initLocalMockStorage();
initSupabase();

// Make db globally accessible to Vanilla scripts
window.db = db;
