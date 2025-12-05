/**
 * AppLayout.tsx - Main Application Layout
 * 
 * Provides the consistent layout for all authenticated pages:
 * - Sticky header with logo, navigation, and user menu
 * - Responsive navigation (desktop in header, mobile below)
 * - User dropdown with profile info and sign out
 */

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckSquare, LayoutDashboard, FolderKanban, Users, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { profile, signOut, isAdmin, isDepartmentHead } = useAuth();
  const location = useLocation();

  // Navigation items - User Management only visible to admins
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    ...(isAdmin ? [{ name: 'User Management', href: '/users', icon: Users }] : []),
  ];

  /** Get initials from full name (e.g., "John Doe" -> "JD") */
  const getInitials = (name: string) => 
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  /** Get human-readable role label */
  const getRoleLabel = () => {
    if (isAdmin) return 'Admin';
    if (isDepartmentHead) return 'Department Head';
    return 'Employee';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="p-1.5 bg-primary rounded-lg">
                <CheckSquare className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline">TaskFlow</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link key={item.name} to={item.href}>
                    <Button variant={isActive ? 'secondary' : 'ghost'} size="sm" className="gap-2">
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Menu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {profile ? getInitials(profile.full_name) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium">{profile?.full_name}</span>
                  <span className="text-xs text-muted-foreground">{getRoleLabel()}</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{profile?.full_name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{profile?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation - shown below header on small screens */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href}>
                <Button variant={isActive ? 'secondary' : 'ghost'} size="sm" className="gap-2 whitespace-nowrap">
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Page Content */}
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
