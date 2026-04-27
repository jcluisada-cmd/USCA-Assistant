// shared/module-visibility.js
// Runtime de filtrage UI par rôle (P5).
// Dépendances chargées AVANT ce fichier :
//   - shared/supabase.js (expose window.sb)
//   - shared/modules-config.js (window.MODULES_CONFIG, MODULES_ROLES, MODULES_ROLE_LABELS)

window.moduleVisibility = {
  STYLE_ID: 'module-visibility-style',
  EDIT_GEAR_CLASS: 'module-edit-gear',
  BANNER_ID: 'module-edit-banner',

  // -- 1. Application du filtrage au chargement -------------
  // Lit la BDD et injecte le <style> qui cache les modules
  // masqués pour le rôle du soignant connecté. Bypass si admin.
  async apply(profile) {
    if (!profile) return;
    if (profile.is_admin) return; // admin voit tout
    try {
      const { data, error } = await window.sb
        .from('role_modules_hidden')
        .select('module_id')
        .eq('role', profile.role);
      if (error) {
        console.warn('[moduleVisibility] apply failed:', error.message);
        return;
      }
      const hidden = (data || []).map(r => r.module_id);
      this._inject(hidden);
    } catch (e) {
      console.warn('[moduleVisibility] apply threw:', e);
    }
  },

  // Injecte/met à jour le <style> de masquage. Vide = pas de masquage.
  _inject(hiddenIds) {
    let style = document.getElementById(this.STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = this.STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = hiddenIds.length
      ? hiddenIds.map(id => `[data-module="${id}"]{display:none!important}`).join('')
      : '';
  },

  // Active/désactive le <style> sans le supprimer (utilisé par edit mode).
  setEnabled(enabled) {
    const style = document.getElementById(this.STYLE_ID);
    if (style) style.disabled = !enabled;
  },

  // -- 2. Mutation BDD -------------------------------------
  async toggleHidden(role, moduleId, shouldHide) {
    try {
      if (shouldHide) {
        const { data: { user } } = await window.sb.auth.getUser();
        const { error } = await window.sb
          .from('role_modules_hidden')
          .upsert({ role, module_id: moduleId, updated_by: user?.id || null });
        if (error) throw error;
      } else {
        const { error } = await window.sb
          .from('role_modules_hidden')
          .delete()
          .eq('role', role)
          .eq('module_id', moduleId);
        if (error) throw error;
      }
      return { ok: true };
    } catch (e) {
      console.error('[moduleVisibility] toggleHidden failed:', e);
      return { ok: false, error: e.message || String(e) };
    }
  },

  // -- 3. Lecture pour UI admin (matrix + popover) ---------
  // Retourne { medecin: Set('patient_craving'), pharmacien: Set(...) , ... }
  async fetchHiddenMap() {
    try {
      const { data, error } = await window.sb
        .from('role_modules_hidden')
        .select('role, module_id');
      if (error) throw error;
      const map = {};
      window.MODULES_ROLES.forEach(r => { map[r] = new Set(); });
      (data || []).forEach(r => { map[r.role]?.add(r.module_id); });
      return map;
    } catch (e) {
      console.error('[moduleVisibility] fetchHiddenMap failed:', e);
      const empty = {};
      window.MODULES_ROLES.forEach(r => { empty[r] = new Set(); });
      return empty;
    }
  },

  // -- 4. Helper : trouver le 1er élément DOM d'un module --
  getModuleEl(moduleId) {
    return document.querySelector(`[data-module="${moduleId}"]`);
  },

  // -- 5. Edit mode : mount des boutons par module ---------
  // Idempotent -- appelable plusieurs fois sans dupliquer.
  async mountEditButtons(onGearClick) {
    const seen = new Set();
    document.querySelectorAll('[data-module]').forEach(el => {
      const moduleId = el.getAttribute('data-module');
      if (seen.has(moduleId)) return; // un seul bouton par moduleId (le premier anchor)
      seen.add(moduleId);
      if (el.querySelector(`:scope > .${this.EDIT_GEAR_CLASS}`)) return; // déjà monté
      const computed = window.getComputedStyle(el);
      if (computed.position === 'static') el.style.position = 'relative';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = this.EDIT_GEAR_CLASS;
      btn.setAttribute('data-module-gear', moduleId);
      btn.textContent = '⚙️'; // gear emoji via textContent (pas d'innerHTML)
      btn.title = `Configurer la visibilité du module ${moduleId}`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        onGearClick(moduleId, el);
      });
      el.appendChild(btn);
    });
    // Marque les modules ayant >= 1 ligne en BDD (pour le liseré rouge)
    const map = await this.fetchHiddenMap();
    const hasHides = new Set();
    Object.values(map).forEach(set => set.forEach(id => hasHides.add(id)));
    document.querySelectorAll('[data-module]').forEach(el => {
      const id = el.getAttribute('data-module');
      el.classList.toggle('has-hides', hasHides.has(id));
    });
    return map;
  },
};
