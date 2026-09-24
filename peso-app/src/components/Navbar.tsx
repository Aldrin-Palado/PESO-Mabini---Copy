import React from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
	return (
		<header style={{background: 'var(--card-bg)', padding: '12px 24px', boxShadow: 'var(--shadow)'}}>
			<nav style={{maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
				<div style={{fontWeight: 700}}>PESO-Mabini</div>
				<div style={{display: 'flex', gap: 12}}>
					<Link to="/" style={{textDecoration: 'none'}}>Home</Link>
					<Link to="/JobVacancies" style={{textDecoration: 'none'}}>Jobs</Link>
					<Link to="/Contact" style={{textDecoration: 'none'}}>Contact</Link>
				</div>
			</nav>
		</header>
	);
};

export default Navbar;
