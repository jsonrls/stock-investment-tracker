import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  LineChart,
  PieChart,
  Star,
} from 'lucide-react';
import styles from './landing.module.css';

export const metadata: Metadata = {
  title: 'PSE Portfolio — Invest with a clearer view',
  description:
    'A focused Philippine Stock Exchange dashboard for tracking holdings, watchlists, market movement, and portfolio performance.',
};

const features = [
  {
    icon: LineChart,
    number: '01',
    title: 'See the market clearly',
    copy: 'Search PSE-listed securities, review price history, and scan the day’s most active names.',
  },
  {
    icon: PieChart,
    number: '02',
    title: 'Know your position',
    copy: 'Track average cost, allocation, cash, and profit or loss in one calm, focused workspace.',
  },
  {
    icon: Star,
    number: '03',
    title: 'Keep ideas close',
    copy: 'Build a watchlist, revisit opportunities, and optionally sync your portfolio across devices.',
  },
];

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.grain} aria-hidden="true" />

      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="PSE Portfolio home">
          <span className={styles.brandMark}>
            <Image src="/logo.png" alt="" width={44} height={44} priority />
          </span>
          <span>PSE Portfolio</span>
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#features">Features</a>
          <Link href="/dashboard" className={styles.navCta}>
            Open dashboard <ArrowUpRight size={15} strokeWidth={1.8} />
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>
            <span className={styles.liveDot} />
            Built for the Philippine market
          </div>
          <h1>
            Your portfolio,
            <span>in one clear view.</span>
          </h1>
          <p className={styles.lead}>
            Follow PSE securities, understand your exposure, and make sense of
            every position without the spreadsheet clutter.
          </p>
          <div className={styles.heroActions}>
            <Link href="/dashboard" className={styles.primaryCta}>
              View your portfolio <ArrowRight size={17} />
            </Link>
            <span className={styles.note}>Free to use · No card required</span>
          </div>
        </div>

        <div className={styles.heroVisual} aria-label="Portfolio dashboard preview">
          <div className={styles.visualStamp}>PSE / PORTFOLIO</div>
          <div className={styles.portfolioCard}>
            <div className={styles.cardTopline}>
              <div>
                <span className={styles.cardLabel}>Total portfolio</span>
                <strong>₱428,640.00</strong>
              </div>
              <span className={styles.period}>This month</span>
            </div>

            <div className={styles.performance}>
              <span>+₱31,840.00</span>
              <small>+8.02%</small>
            </div>

            <div className={styles.chart} aria-hidden="true">
              <svg viewBox="0 0 560 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d7ff64" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#d7ff64" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className={styles.chartFill}
                  d="M0 124 C50 116 75 130 112 103 S173 83 216 91 S283 68 325 78 S388 58 420 62 S487 30 560 18 L560 150 L0 150 Z"
                />
                <path
                  className={styles.chartLine}
                  d="M0 124 C50 116 75 130 112 103 S173 83 216 91 S283 68 325 78 S388 58 420 62 S487 30 560 18"
                />
              </svg>
            </div>

            <div className={styles.holdings}>
              <div className={styles.holding}>
                <span className={styles.ticker}>BDO</span>
                <span>BDO Unibank</span>
                <strong>₱152.30</strong>
                <em>+1.34%</em>
              </div>
              <div className={styles.holding}>
                <span className={styles.ticker}>ALI</span>
                <span>Ayala Land</span>
                <strong>₱25.85</strong>
                <em>+0.78%</em>
              </div>
              <div className={styles.holding}>
                <span className={styles.ticker}>TEL</span>
                <span>PLDT Inc.</span>
                <strong>₱1,286.00</strong>
                <em className={styles.negative}>−0.31%</em>
              </div>
            </div>
          </div>
          <div className={styles.visualCaption}>
            <BarChart3 size={16} /> Delayed / end-of-day market data
          </div>
        </div>
      </section>

      <section className={styles.proof} aria-label="Product highlights">
        <span>Portfolio analytics</span>
        <span>Historical charts</span>
        <span>Personal watchlist</span>
        <span>Optional cloud sync</span>
      </section>

      <section className={styles.features} id="features">
        <div className={styles.sectionIntro}>
          <span>One workspace</span>
          <h2>Less noise. Better context.</h2>
          <p>
            Everything you need to monitor a long-term PSE portfolio—nothing
            you don’t.
          </p>
        </div>

        <div className={styles.featureGrid}>
          {features.map(({ icon: Icon, number, title, copy }) => (
            <article className={styles.featureCard} key={number}>
              <div className={styles.featureMeta}>
                <Icon size={21} strokeWidth={1.7} />
                <span>{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <div>
          <span>Ready when you are</span>
          <h2>Put your portfolio in perspective.</h2>
        </div>
        <Link href="/dashboard" className={styles.primaryCta}>
          Open the dashboard <ArrowRight size={17} />
        </Link>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} PSE Portfolio</span>
        <p>For monitoring and educational use. Not investment advice.</p>
      </footer>
    </main>
  );
}
