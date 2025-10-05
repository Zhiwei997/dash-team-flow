import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
                setError(error.message);
                toast.error("Password Reset Failed", {
                    description: error.message,
                });
            } else {
                setSuccess(true);
                toast.success("Password Reset Email Sent", {
                    description: "Check your email for password reset instructions.",
                });
            }
        } catch (err) {
            const errorMessage = "An unexpected error occurred";
            setError(errorMessage);
            toast.error("Password Reset Failed", {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-foreground">
                            Check Your Email
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center space-y-4">
                            <p className="text-muted-foreground">
                                We've sent password reset instructions to{" "}
                                <span className="font-medium text-foreground">{email}</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Click the link in the email to reset your password. The link will
                                expire in 1 hour.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={() => {
                                    setSuccess(false);
                                    setEmail("");
                                }}
                                variant="outline"
                                className="w-full"
                            >
                                Send Another Email
                            </Button>
                            <Button variant="ghost" asChild className="w-full">
                                <Link to="/login">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Login
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold text-foreground">
                        Reset Your Password
                    </CardTitle>
                    <p className="text-muted-foreground">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-muted/50"
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            <Mail className="h-4 w-4 mr-2" />
                            {loading ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </form>

                    <div className="text-center">
                        <Button variant="ghost" asChild>
                            <Link to="/login">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Login
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPassword;
