import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // دالة لترتيب العمليات بشكل صحيح باستخدام async/await
    const setupAuth = async () => {
      try {
        // 1. احصل على الجلسة الحالية أولاً وانتظر النتيجة
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting initial session:', sessionError);
          // حتى لو حدث خطأ، يجب أن نكمل إعداد المستمع
        }
        
        // 2. قم بتعيين الحالة الأولية بناءً على الجلسة التي حصلت عليها
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

      } catch (error) {
        console.error("An unexpected error occurred during session retrieval:", error);
        setSession(null);
        setUser(null);
      } finally {
        // 3. الآن وبعد أن استقرت الحالة الأولية، قم بإنهاء التحميل
        setLoading(false);
      }

      // 4. الآن قم بإعداد المستمع للتغييرات المستقبلية (تسجيل الدخول/الخروج)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        // لا نحتاج لتغيير حالة التحميل هنا لأنها للتغييرات فقط
      });

      // 5. عند إزالة المكون، قم بإلغاء الاشتراك
      return () => {
        subscription?.unsubscribe();
      };
    };

    // قم بتشغيل الدالة
    setupAuth();

  }, []); // يعمل هذا التأثير مرة واحدة فقط عند تحميل المكون

  return { user, session, loading };
};