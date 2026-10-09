import { site } from '../content/site';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <a href="#home">Back to top ↑</a>
      </div>
    </footer>
  );
}
