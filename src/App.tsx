import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';
import { SearchPage } from './pages/SearchPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { MyProjectsPage } from './pages/MyProjectsPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { StudentProfilePage } from './pages/admin/StudentProfilePage';
import { AcademicIntegrityPage } from './pages/AcademicIntegrityPage';
import { AboutPage, ContactPage, FAQPage, PrivacyPolicyPage, TermsPage } from './pages/InfoPages';

function AppContent() {
  const { user, isAdmin } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [navParams, setNavParams] = useState<Record<string, any>>({});

  const handleNavigate = (page: string, params: Record<string, any> = {}) => {
    setCurrentPage(page);
    setNavParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'projects':
        return (
          <ProjectsPage
            initialProgram={navParams.program}
            initialCourseCode={navParams.courseCode}
            onNavigate={handleNavigate}
          />
        );
      case 'categories':
        return <CategoriesPage onNavigate={handleNavigate} />;
      case 'subjects':
        return <SubjectsPage onNavigate={handleNavigate} />;
      case 'project-details':
        return <ProjectDetailsPage topicId={navParams.topicId} onNavigate={handleNavigate} />;
      case 'search':
        return <SearchPage initialQuery={navParams.query} onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      case 'admin-login':
        return <AdminLoginPage onNavigate={handleNavigate} />;
      case 'student-dashboard':
        return <StudentDashboardPage onNavigate={handleNavigate} />;
      case 'my-projects':
        return <MyProjectsPage onNavigate={handleNavigate} />;
      case 'checkout':
        return (
          <CheckoutPage
            topicId={navParams.topicId}
            courseCode={navParams.courseCode}
            program={navParams.program}
            onNavigate={handleNavigate}
          />
        );
      case 'admin-dashboard':
        return <AdminDashboardPage initialTab={navParams.tab} onNavigate={handleNavigate} />;
      case 'admin-student-profile':
        return <StudentProfilePage studentId={navParams.studentId} onNavigate={handleNavigate} />;
      case 'academic-integrity':
        return <AcademicIntegrityPage onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactPage onNavigate={handleNavigate} />;
      case 'faq':
        return <FAQPage onNavigate={handleNavigate} />;
      case 'privacy':
        return <PrivacyPolicyPage onNavigate={handleNavigate} />;
      case 'terms':
        return <TermsPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 pb-16">{renderPage()}</main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
