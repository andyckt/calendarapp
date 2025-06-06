"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true)
    try {
      console.log("Attempting to register with:", { name: data.name, email: data.email })
      await register(data.name, data.email, data.password)
      toast.success("Registration successful")
      router.push("/")
    } catch (error) {
      console.error("Registration error details:", error)
      if (error instanceof Error) {
        console.error("Error message:", error.message)
        toast.error(`Registration failed: ${error.message}`)
      } else {
        console.error("Unknown error type:", typeof error)
        toast.error("Registration failed. This email may already be in use.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Create an account</h2>
        <p className="mt-2 text-white/70">Sign up to get started</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Your name"
                    disabled={isLoading}
                    className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your.email@example.com"
                    type="email"
                    disabled={isLoading}
                    className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    disabled={isLoading}
                    className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    disabled={isLoading}
                    className="bg-white/10 text-white border-white/20 placeholder:text-white/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Form>
    </div>
  )
} 