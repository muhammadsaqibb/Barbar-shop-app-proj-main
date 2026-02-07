
'use client';

import RegisterForm from '@/components/auth/register-form';
import { Card, CardDescription, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/context/language-provider';

export default function RegisterPage() {
    const { t } = useTranslation();
    return (
        <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-2xl shadow-2xl border-border/20 transition-all duration-500 hover:shadow-primary/5">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-headline">{t('register_page_title')}</CardTitle>
                    <CardDescription className="pt-2">
                        {t('register_page_desc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm />
                </CardContent>
            </Card>
        </div>
    );
}
