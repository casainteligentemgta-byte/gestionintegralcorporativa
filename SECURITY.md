# 🔒 SECURITY IMPLEMENTATION GUIDE

## ✅ Completed Security Fixes

### 1. Removed Hardcoded Authentication Bypass
**File:** `pages/Login.tsx`
- ❌ **Removed:** Hardcoded admin credentials (`admin@kore.com` / `KORE2026`)
- ✅ **Result:** All authentication now goes through Supabase Auth
- **Impact:** Prevents unauthorized access via exposed credentials

### 2. Implemented Safe Redirect URLs
**Files:** `pages/Login.tsx`, `utils/security.ts`
- ✅ **Added:** Whitelist of allowed redirect URLs
- ✅ **Added:** `getSafeRedirectUrl()` utility function
- **Impact:** Prevents open redirect vulnerabilities in OAuth flows

### 3. Removed Admin Key Bypass
**Files:** `pages/MaterialForm.tsx`, `services/dataService.ts`
- ❌ **Removed:** Hardcoded admin key (`KORE-ADMIN-2024`)
- ✅ **Result:** All inventory operations require valid reference documents
- **Impact:** Prevents unauthorized inventory manipulation

### 4. Added Input Validation
**Files:** `services/dataService.ts`, `utils/validation.ts`
- ✅ **Added:** Strict type definitions for database updates
- ✅ **Added:** Field sanitization in `updatePurchase()`
- **Impact:** Prevents unauthorized field injection attacks

---

## 🚨 CRITICAL: Required Supabase Configuration

### Step 1: Enable Row Level Security (RLS)

You MUST enable RLS on all tables in Supabase. Run this SQL in your Supabase SQL Editor:

\`\`\`sql
-- Enable RLS on all critical tables
ALTER TABLE "Facturas_Compras" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proveedores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventario_Global" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Material_Requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Detalle_Compra" ENABLE ROW LEVEL SECURITY;
\`\`\`

### Step 2: Create Basic RLS Policies

\`\`\`sql
-- Example: Facturas_Compras policies
-- Admins can see everything
CREATE POLICY "Admins can view all purchases"
ON "Facturas_Compras"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'manager')
  )
);

-- Only admins can modify
CREATE POLICY "Only admins can modify purchases"
ON "Facturas_Compras"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente')
  )
);

-- Example: user_profiles policies
CREATE POLICY "Users can view own profile"
ON "user_profiles"
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON "user_profiles"
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
\`\`\`

### Step 3: Configure Auth Settings

In Supabase Dashboard > Authentication > Settings:

1. **Enable Secure Cookies:**
   - ✅ Enable "Secure session cookies"
   - Set cookie domain to your production domain

2. **Configure Rate Limiting:**
   - Max login attempts: 5 per hour per IP
   - Max signup attempts: 3 per hour per IP

3. **Email Settings:**
   - ✅ Confirm email before allowing login (recommended)
   - Set proper email templates

---

## 🔐 Environment Variables Security

### ✅ Safe Variables (Client-side)
These use `VITE_` prefix and are safe to expose:
\`\`\`bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
\`\`\`

### ❌ NEVER Expose (Server-side only)
These should NEVER have `VITE_` prefix:
\`\`\`bash
# ❌ WRONG - This exposes the key to the client
VITE_GEMINI_API_KEY=your-api-key

# ✅ CORRECT - Only accessible server-side
GEMINI_API_KEY=your-api-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

---

## 📝 TODO: Implement Edge Functions

For features that require elevated privileges (like manual inventory entry), implement Supabase Edge Functions:

### Example: Admin Inventory Entry

Create `supabase/functions/admin-inventory-entry/index.ts`:

\`\`\`typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Verify user authentication
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabaseClient.auth.getUser(token)

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Check user role
  const { data: profile } = await supabaseClient
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!['admin', 'gerente'].includes(profile?.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Process manual entry
  const payload = await req.json()
  
  // ... implement inventory entry logic here
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
\`\`\`

Deploy with:
\`\`\`bash
supabase functions deploy admin-inventory-entry
\`\`\`

Call from frontend:
\`\`\`typescript
const { data, error } = await supabase.functions.invoke('admin-inventory-entry', {
  body: { itemId, quantity, locationId }
})
\`\`\`

---

## 🎯 Security Checklist

### Before Production Deployment:

- [ ] All tables have RLS enabled
- [ ] Basic RLS policies created for each table
- [ ] No hardcoded credentials in code
- [ ] No sensitive API keys exposed via VITE_ prefix
- [ ] Secure cookies enabled in Supabase Auth
- [ ] Rate limiting configured
- [ ] Email confirmation enabled (if applicable)
- [ ] Redirect URLs whitelisted
- [ ] Edge Functions deployed for admin operations
- [ ] Test with non-admin user to verify access controls

### Regular Security Maintenance:

- [ ] Review and update RLS policies monthly
- [ ] Rotate API keys quarterly
- [ ] Monitor Supabase logs for suspicious activity
- [ ] Keep dependencies updated
- [ ] Review user roles and permissions

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 🆘 Support

If you need help implementing these security measures, contact your security team or Supabase support.

**Remember:** Security is not a one-time task. Regular audits and updates are essential.
