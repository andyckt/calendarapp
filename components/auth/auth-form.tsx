"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LoginForm from "./login-form"
import RegisterForm from "./register-form"

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState("login")

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md">
        <TabsList className="grid grid-cols-2 w-full bg-white/10 text-white">
          <TabsTrigger value="login" className="data-[state=active]:bg-white/20">
            Login
          </TabsTrigger>
          <TabsTrigger value="register" className="data-[state=active]:bg-white/20">
            Register
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
          <div className="mt-4 text-center text-white/70">
            <p>Don't have an account?</p>
            <Button
              variant="link"
              onClick={() => setActiveTab("register")}
              className="text-blue-300 hover:text-blue-400"
            >
              Sign up here
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="register">
          <RegisterForm />
          <div className="mt-4 text-center text-white/70">
            <p>Already have an account?</p>
            <Button
              variant="link"
              onClick={() => setActiveTab("login")}
              className="text-blue-300 hover:text-blue-400"
            >
              Sign in here
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 