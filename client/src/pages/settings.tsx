import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Shield, Palette, Globe, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiPut } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and system configurations.</p>
      </div>

      <div className="grid gap-6">
        {/* Appearance Settings */}
        <Card className="card-container border-none bg-white">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Appearance</CardTitle>
            </div>
            <CardDescription>Customize how PharmaPro looks on your device.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Dark Mode</h4>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes.</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} className="data-[state=checked]:bg-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="card-container border-none bg-white">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Security</CardTitle>
            </div>
            <CardDescription>Manage your account security and authentication methods.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} className="data-[state=checked]:bg-primary" />
            </div>
            <div className="border-t border-border/50 pt-6">
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => setPasswordOpen(true)}>
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="card-container border-none bg-white">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Notifications</CardTitle>
            </div>
            <CardDescription>Choose what updates you want to receive.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Email Notifications</h4>
                <p className="text-sm text-muted-foreground">Receive daily summaries and critical alerts via email.</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} className="data-[state=checked]:bg-primary" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Push Notifications</h4>
                <p className="text-sm text-muted-foreground">Get instant alerts for new orders and low stock.</p>
              </div>
              <Switch checked={true} className="data-[state=checked]:bg-primary" />
            </div>
          </CardContent>
        </Card>

        {/* Region */}
        <Card className="card-container border-none bg-white">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Region & Language</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Language</label>
                <select className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none">
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Currency</label>
                <select className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none">
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-4">
          <Button
            className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 shadow-lg shadow-primary/25"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await apiPut("/api/me", { name: user?.name });
                toast({ title: "Saved", description: "Profile updated." });
              } catch (e) {
                toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to save", variant: "destructive" });
              } finally {
                setSaving(false);
              }
            }}
          >
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </div>
      </div>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>New password (min 6 characters)</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPasswordOpen(false); setNewPassword(""); }}>Cancel</Button>
            <Button
              onClick={async () => {
                if (newPassword.length < 6) {
                  toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
                  return;
                }
                try {
                  await apiPut("/api/me", { password: newPassword });
                  toast({ title: "Password updated" });
                  setPasswordOpen(false);
                  setNewPassword("");
                } catch (e) {
                  toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
                }
              }}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
