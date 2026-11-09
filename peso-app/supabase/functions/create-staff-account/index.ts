import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { withSupabase } from "jsr:@supabase/server@^1";

interface CreateStaffPayload {
  full_name: string;
  email: string;
  password: string;
  contact_no?: string;
}

console.info("create-staff-account function started");

export default {
  fetch: withSupabase(
    {
      // The function is called by a logged-in PESO user.
      // The Superadmin check is performed below.
      auth: "user",
    },

    async (req, ctx) => {
      try {
        // ============================================================
        // 1. ONLY ALLOW POST REQUESTS
        // ============================================================

        if (req.method !== "POST") {
          return Response.json(
            {
              success: false,
              message: "Method not allowed.",
            },
            { status: 405 }
          );
        }

        // ============================================================
        // 2. GET CURRENTLY LOGGED-IN USER
        // ============================================================

        const {
          data: { user },
          error: userError,
        } = await ctx.supabase.auth.getUser();

        if (userError || !user) {
          console.error("User authentication error:", userError);

          return Response.json(
            {
              success: false,
              message: "You must be logged in.",
            },
            { status: 401 }
          );
        }

        console.info("Authenticated user:", user.id);

        // ============================================================
        // 3. VERIFY THAT USER IS AN ACTIVE SUPERADMIN
        // ============================================================

        // IMPORTANT:
        // Use ctx.supabaseAdmin here because the peso_admin table
        // may have RLS policies that prevent normal users from
        // reading administrator records.

        const {
          data: admin,
          error: adminError,
        } = await ctx.supabaseAdmin
          .from("peso_admin")
          .select(
            "admin_id, user_id, full_name, email, is_active"
          )
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (adminError) {
          console.error(
            "Admin verification error:",
            adminError
          );

          return Response.json(
            {
              success: false,
              message:
                "Unable to verify administrator account.",
              error: adminError.message,
            },
            { status: 500 }
          );
        }

        if (!admin) {
          console.warn(
            "Unauthorized staff-account creation attempt by:",
            user.id
          );

          return Response.json(
            {
              success: false,
              message:
                "Access denied. Only the PESO Superadmin can create staff accounts.",
            },
            { status: 403 }
          );
        }

        console.info(
          "Superadmin verified:",
          admin.email
        );

        // ============================================================
        // 4. READ REQUEST BODY
        // ============================================================

        let body: CreateStaffPayload;

        try {
          body = await req.json();
        } catch (error) {
          console.error("Invalid JSON body:", error);

          return Response.json(
            {
              success: false,
              message: "Invalid request body.",
            },
            { status: 400 }
          );
        }

        const full_name = body.full_name?.trim();
        const email = body.email?.trim().toLowerCase();
        const password = body.password;
        const contact_no =
          body.contact_no?.trim() || null;

        // ============================================================
        // 5. VALIDATE INPUT
        // ============================================================

        if (
          !full_name ||
          !email ||
          typeof password !== "string" ||
          !password
        ) {
          return Response.json(
            {
              success: false,
              message:
                "Full name, email, and password are required.",
            },
            { status: 400 }
          );
        }

        const passwordError =
          password.length < 8
            ? "Password must contain at least 8 characters."
            : !/[A-Z]/.test(password)
              ? "Password must contain at least one uppercase letter."
              : !/[a-z]/.test(password)
                ? "Password must contain at least one lowercase letter."
                : !/[0-9]/.test(password)
                  ? "Password must contain at least one number."
                  : !/[\p{P}\p{S}]/u.test(password)
                    ? "Password must contain at least one special character."
                    : /\s/.test(password)
                      ? "Password must not contain spaces."
                      : null;

        if (passwordError) {
          return Response.json(
            {
              success: false,
              message: passwordError,
            },
            { status: 400 }
          );
        }

        // Basic email validation
        const emailRegex =
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
          return Response.json(
            {
              success: false,
              message: "Please provide a valid email address.",
            },
            { status: 400 }
          );
        }

        // ============================================================
        // 6. CHECK IF STAFF EMAIL ALREADY EXISTS
        // ============================================================

        const {
          data: existingStaff,
          error: existingError,
        } = await ctx.supabaseAdmin
          .from("peso_staff")
          .select("peso_staff_id")
          .eq("email", email)
          .maybeSingle();

        if (existingError) {
          console.error(
            "Existing staff check error:",
            existingError
          );

          return Response.json(
            {
              success: false,
              message:
                "Unable to check existing staff accounts.",
              error: existingError.message,
            },
            { status: 500 }
          );
        }

        if (existingStaff) {
          return Response.json(
            {
              success: false,
              message:
                "A PESO staff account with this email already exists.",
            },
            { status: 409 }
          );
        }

        // ============================================================
        // 7. CREATE SUPABASE AUTH ACCOUNT
        // ============================================================

        console.info(
          "Creating Auth account for:",
          email
        );

        const {
          data: authData,
          error: authError,
        } = await ctx.supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,

          user_metadata: {
            full_name,
            role: "peso_staff",
          },
        });

        if (authError || !authData.user) {
          console.error(
            "Auth creation error:",
            authError
          );

          return Response.json(
            {
              success: false,
              message:
                authError?.message ||
                "Unable to create authentication account.",
            },
            { status: 400 }
          );
        }

        const newUser = authData.user;

        console.info(
          "Auth account created:",
          newUser.id
        );

        // ============================================================
        // 8. CREATE PESO STAFF RECORD
        // ============================================================

        const {
          data: staff,
          error: staffError,
        } = await ctx.supabaseAdmin
          .from("peso_staff")
          .insert({
            user_id: newUser.id,
            admin_id: admin.admin_id,
            full_name,
            email,
            contact_no,
            is_active: true,
          })
          .select()
          .single();

        // ============================================================
        // 9. CLEAN UP AUTH ACCOUNT IF STAFF INSERT FAILS
        // ============================================================

        if (staffError || !staff) {
          console.error(
            "peso_staff creation error:",
            staffError
          );

          try {
            await ctx.supabaseAdmin.auth.admin.deleteUser(
              newUser.id
            );
          } catch (cleanupError) {
            console.error(
              "Auth cleanup error:",
              cleanupError
            );
          }

          return Response.json(
            {
              success: false,
              message:
                "Staff profile could not be created.",
              error:
                staffError?.message ||
                "Unknown staff profile error.",
            },
            { status: 500 }
          );
        }

        console.info(
          "peso_staff record created:",
          staff.peso_staff_id
        );

        // ============================================================
        // 10. CREATE DEFAULT STAFF PERMISSIONS
        // ============================================================

        const {
          error: permissionError,
        } = await ctx.supabaseAdmin
          .from("staff_permissions")
          .insert({
            peso_staff_id: staff.peso_staff_id,

            dashboard_overview: false,
            analytics: false,
            job_posts: false,
            job_application: false,
            employers: false,
            job_seekers: false,
            notifications: false,
          });

        // ============================================================
        // 11. CLEAN UP IF PERMISSIONS FAIL
        // ============================================================

        if (permissionError) {
          console.error(
            "Permission creation error:",
            permissionError
          );

          // Delete staff database record
          await ctx.supabaseAdmin
            .from("peso_staff")
            .delete()
            .eq(
              "peso_staff_id",
              staff.peso_staff_id
            );

          // Delete Auth account
          try {
            await ctx.supabaseAdmin.auth.admin.deleteUser(
              newUser.id
            );
          } catch (cleanupError) {
            console.error(
              "Auth cleanup error:",
              cleanupError
            );
          }

          return Response.json(
            {
              success: false,
              message:
                "Staff account was not completed because permissions could not be created.",
              error: permissionError.message,
            },
            { status: 500 }
          );
        }

        console.info(
          "Default permissions created for:",
          staff.peso_staff_id
        );

        // ============================================================
        // 12. RECORD ACTIVITY
        // ============================================================

        const {
          error: logError,
        } = await ctx.supabaseAdmin
          .from("admin_activity_log")
          .insert({
            admin_id: admin.admin_id,
            peso_staff_id: staff.peso_staff_id,
            action: "CREATE_STAFF_ACCOUNT",

            details: {
              staff_name: full_name,
              staff_email: email,
            },
          });

        if (logError) {
          // We don't cancel the account because the actual
          // staff account was successfully created.
          console.error(
            "Activity log error:",
            logError
          );
        }

        // ============================================================
        // 13. SUCCESS
        // ============================================================

        console.info(
          "Staff account created successfully:",
          email
        );

        return Response.json(
          {
            success: true,

            message:
              "PESO Staff account created successfully.",

            staff: {
              peso_staff_id:
                staff.peso_staff_id,

              user_id: staff.user_id,

              full_name:
                staff.full_name,

              email:
                staff.email,

              contact_no:
                staff.contact_no,

              is_active:
                staff.is_active,
            },
          },
          { status: 201 }
        );
      } catch (error) {
        console.error(
          "Unexpected function error:",
          error
        );

        return Response.json(
          {
            success: false,

            message:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred.",
          },
          { status: 500 }
        );
      }
    }
  ),
};