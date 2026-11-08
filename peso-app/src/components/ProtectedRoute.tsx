import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabase";

type ProtectedRouteProps = {
	children: ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		let active = true;
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			if (active) setIsAuthenticated(Boolean(session));
		});

		void supabase.auth.getSession().then(({ data: { session }, error }) => {
			if (active) setIsAuthenticated(!error && Boolean(session));
		});

		return () => {
			active = false;
			subscription.unsubscribe();
		};
	}, []);

	if (isAuthenticated === null) return null;
	return isAuthenticated ? children : <Navigate to="/login" replace />;
}
