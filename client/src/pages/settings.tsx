import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Shield, Palette, Globe, Save } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [language, setLanguage] = useState("English (US)");
  const [currency, setCurrency] = useState("USD ($)");
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your account preferences and system configurations.</p>
      </div>

      <div className="grid gap-6">
        <Card className="card-container">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
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

        <Card className="card-container">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Security</CardTitle>
            </div>
            <CardDescription>Manage your account security and authentication methods.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} className="data-[state=checked]:bg-primary" />
            </div>
            <div className="border-t border-border/50 pt-6">
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setPasswordOpen(true)}>
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="card-container">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Notifications</CardTitle>
            </div>
            <CardDescription>Choose what updates you want to receive.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
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

        <Card className="card-container">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Region & Language</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full rounded-xl border-border/50 bg-background">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English (US)">English (US)</SelectItem>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="w-full rounded-xl border-border/50 bg-background">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD ($)">USD ($)</SelectItem>
                    <SelectItem value="EUR (EUR)">EUR (EUR)</SelectItem>
                    <SelectItem value="GBP (GBP)">GBP (GBP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex justify-end">
          <Button
            className="rounded-xl bg-primary px-8 text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
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
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>New password (min 6 characters)</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="********" minLength={6} />
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
