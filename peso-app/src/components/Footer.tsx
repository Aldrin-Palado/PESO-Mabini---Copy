import React from "react";

const Footer: React.FC = () => {
	return (
		<footer style={{borderTop: '1px solid var(--border)', marginTop: 32, padding: '18px 0'}}>
			<div style={{maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<div>© {new Date().getFullYear()} PESO-Mabini</div>
				<div style={{display: 'flex', gap: 12}}>
					<a href="/About">About</a>
					<a href="/Contact">Contact</a>
				</div>
			</div>
		</footer>
	);
};

export default Footer;

