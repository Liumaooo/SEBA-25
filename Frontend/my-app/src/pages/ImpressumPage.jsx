import React from 'react';
import { Link } from 'react-router-dom';
import './ImpressumPage.css';

const ImpressumPage = () => {
  return (
    <div className="impressum-container">
      <div className="impressum-content">
        <h1>Impressum</h1>
        
        <section className="impressum-section">
          <h2>Angaben gemäß § 5 TMG</h2>
          <p><strong>Cat Connect</strong><br />
          Arcisstraße 21<br />
          80333 München<br />
          Deutschland</p>
        </section>

        <section className="impressum-section">
          <h2>Vertreten durch</h2>
          <p>Max Mustermann<br />
          Geschäftsführer</p>
        </section>

        <section className="impressum-section">
          <h2>Kontakt</h2>
          <p>Telefon: +49 123456789<br />
          E-Mail: contact@catconnect.com</p>
        </section>

        <section className="impressum-section">
          <h2>Registereintrag</h2>
          <p>Eintragung im Handelsregister<br />
          Registergericht: Amtsgericht München<br />
          Registernummer: HRB 123456</p>
        </section>

        <section className="impressum-section">
          <h2>Umsatzsteuer-ID</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
          DE123456789</p>
        </section>

        <section className="impressum-section">
          <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>Max Mustermann<br />
          Arcisstraße 21<br />
          80333 München</p>
        </section>

        <section className="impressum-section">
          <h2>Haftungsausschluss</h2>
          <h3>Haftung für Inhalte</h3>
          <p>Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
          
          <h3>Haftung für Links</h3>
          <p>Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.</p>
        </section>

        <section className="impressum-section">
          <h2>Urheberrecht</h2>
          <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
        </section>
      </div>
    </div>
  );
};

export default ImpressumPage; 