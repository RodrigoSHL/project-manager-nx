'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { SectionHeading } from './section-heading'

interface FormState {
  nombre: string
  empresa: string
  correo: string
  telefono: string
  tipoproyecto: string
  mensaje: string
}

interface FormErrors {
  nombre?: string
  correo?: string
  tipoproyecto?: string
  mensaje?: string
}

const TIPOS_PROYECTO = [
  'Desarrollo de software',
  'Modernización de plataforma',
  'Página o aplicación web',
  'DevOps y automatización',
  'Cloud e infraestructura',
  'Levantamiento de requerimientos',
  'Otro',
]

const INITIAL: FormState = {
  nombre: '',
  empresa: '',
  correo: '',
  telefono: '',
  tipoproyecto: '',
  mensaje: '',
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required,
  placeholder,
}: {
  id: keyof FormState
  label: string
  type?: string
  value: string
  onChange: (val: string) => void
  error?: string
  required?: boolean
  placeholder?: string
}) {
  const turq = 'oklch(0.82 0.18 190)'

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground/80">
        {label}
        {required && (
          <span className="ml-1 text-[oklch(0.75_0.22_340)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:outline-none"
        style={{
          background: 'oklch(0.14 0.016 240 / 0.7)',
          border: `1px solid ${error ? 'oklch(0.75 0.22 340 / 0.6)' : 'oklch(1 0 0 / 0.1)'}`,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = `${turq}60`
          e.target.style.boxShadow = `0 0 0 3px ${turq}12`
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'oklch(0.75 0.22 340 / 0.6)' : 'oklch(1 0 0 / 0.1)'
          e.target.style.boxShadow = 'none'
        }}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-[oklch(0.75_0.22_340)]">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  )
}

export function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<FormErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle')

  function setField(key: keyof FormState, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }))
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio.'
    if (!form.correo.trim()) newErrors.correo = 'El correo es obligatorio.'
    else if (!validateEmail(form.correo)) newErrors.correo = 'Ingresa un correo válido.'
    if (!form.tipoproyecto) newErrors.tipoproyecto = 'Selecciona un tipo de proyecto.'
    if (!form.mensaje.trim()) newErrors.mensaje = 'El mensaje es obligatorio.'
    else if (form.mensaje.trim().length < 20) newErrors.mensaje = 'El mensaje debe tener al menos 20 caracteres.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setStatus('submitting')
    // Simulate async (no real API yet – TODO: connect to backend)
    setTimeout(() => setStatus('success'), 1200)
  }

  const turq = 'oklch(0.82 0.18 190)'

  return (
    <section id="contacto" className="relative py-24 lg:py-32">
      {/* Right glow */}
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, oklch(0.75 0.22 340) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-20">
          {/* Left heading */}
          <div className="lg:w-5/12">
            <SectionHeading
              label="Contacto"
              title="Cuéntanos sobre tu proyecto."
              subtitle="Completa el formulario y nos pondremos en contacto para explorar cómo podemos ayudarte."
              accentColor="pink"
            />

            {/* Direct contact */}
            <div className="mt-8 flex flex-col gap-3">
              <a
                href="mailto:contacto@atomdev.cl"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-turquoise"
              >
                {/* TODO: reemplazar con correo real */}
                contacto@atomdev.cl
              </a>
            </div>
          </div>

          {/* Right form */}
          <div className="lg:w-7/12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl p-6 sm:p-8"
              style={{
                background: 'oklch(0.13 0.018 240 / 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid oklch(1 0 0 / 0.08)',
              }}
            >
              {status === 'success' ? (
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: `${turq}18`, boxShadow: `0 0 24px ${turq}30` }}
                  >
                    <CheckCircle2 size={32} style={{ color: turq }} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Mensaje recibido
                  </h3>
                  <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                    Gracias por contactarnos. Revisaremos tu mensaje y nos comunicaremos contigo a la brevedad.
                  </p>
                  <p className="text-xs text-muted-foreground/50">
                    Nota: el formulario aún no está conectado a un backend real.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      id="nombre"
                      label="Nombre"
                      value={form.nombre}
                      onChange={(v) => setField('nombre', v)}
                      error={errors.nombre}
                      required
                      placeholder="Tu nombre completo"
                    />
                    <InputField
                      id="empresa"
                      label="Empresa u organización"
                      value={form.empresa}
                      onChange={(v) => setField('empresa', v)}
                      placeholder="Nombre de tu organización"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <InputField
                      id="correo"
                      label="Correo electrónico"
                      type="email"
                      value={form.correo}
                      onChange={(v) => setField('correo', v)}
                      error={errors.correo}
                      required
                      placeholder="tu@correo.cl"
                    />
                    <InputField
                      id="telefono"
                      label="Teléfono (opcional)"
                      type="tel"
                      value={form.telefono}
                      onChange={(v) => setField('telefono', v)}
                      placeholder="+56 9 XXXX XXXX"
                    />
                  </div>

                  {/* Type of project */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="tipoproyecto" className="text-sm font-medium text-foreground/80">
                      Tipo de proyecto
                      <span className="ml-1 text-[oklch(0.75_0.22_340)]" aria-hidden="true">*</span>
                    </label>
                    <select
                      id="tipoproyecto"
                      value={form.tipoproyecto}
                      onChange={(e) => setField('tipoproyecto', e.target.value)}
                      aria-required
                      aria-invalid={!!errors.tipoproyecto}
                      aria-describedby={errors.tipoproyecto ? 'tipoproyecto-error' : undefined}
                      className="rounded-lg px-4 py-2.5 text-sm text-foreground transition-all duration-200 focus:outline-none appearance-none"
                      style={{
                        background: 'oklch(0.14 0.016 240 / 0.7)',
                        border: `1px solid ${errors.tipoproyecto ? 'oklch(0.75 0.22 340 / 0.6)' : 'oklch(1 0 0 / 0.1)'}`,
                        color: form.tipoproyecto ? 'oklch(0.93 0.01 240)' : 'oklch(0.6 0.015 240)',
                      }}
                    >
                      <option value="" disabled>
                        Selecciona una opción
                      </option>
                      {TIPOS_PROYECTO.map((t) => (
                        <option key={t} value={t} style={{ background: 'oklch(0.12 0.015 240)', color: 'oklch(0.93 0.01 240)' }}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {errors.tipoproyecto && (
                      <p id="tipoproyecto-error" role="alert" className="flex items-center gap-1.5 text-xs text-[oklch(0.75_0.22_340)]">
                        <AlertCircle size={12} />
                        {errors.tipoproyecto}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="mensaje" className="text-sm font-medium text-foreground/80">
                      Mensaje
                      <span className="ml-1 text-[oklch(0.75_0.22_340)]" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="mensaje"
                      rows={5}
                      value={form.mensaje}
                      onChange={(e) => setField('mensaje', e.target.value)}
                      placeholder="Cuéntanos sobre tu proyecto, qué necesitas construir o mejorar..."
                      aria-required
                      aria-invalid={!!errors.mensaje}
                      aria-describedby={errors.mensaje ? 'mensaje-error' : undefined}
                      className="resize-none rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 transition-all duration-200 focus:outline-none"
                      style={{
                        background: 'oklch(0.14 0.016 240 / 0.7)',
                        border: `1px solid ${errors.mensaje ? 'oklch(0.75 0.22 340 / 0.6)' : 'oklch(1 0 0 / 0.1)'}`,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = `${turq}60`
                        e.target.style.boxShadow = `0 0 0 3px ${turq}12`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = errors.mensaje ? 'oklch(0.75 0.22 340 / 0.6)' : 'oklch(1 0 0 / 0.1)'
                        e.target.style.boxShadow = 'none'
                      }}
                    />
                    {errors.mensaje && (
                      <p id="mensaje-error" role="alert" className="flex items-center gap-1.5 text-xs text-[oklch(0.75_0.22_340)]">
                        <AlertCircle size={12} />
                        {errors.mensaje}
                      </p>
                    )}
                  </div>

                  {/* Required note */}
                  <p className="text-xs text-muted-foreground/50">
                    Los campos marcados con <span className="text-[oklch(0.75_0.22_340)]">*</span> son obligatorios.
                  </p>

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-turquoise px-6 py-3 text-sm font-semibold text-background shadow-lg transition-all duration-200 hover:bg-turquoise/90 hover:shadow-[0_0_24px_oklch(0.82_0.18_190/0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-turquoise/50 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === 'submitting' ? (
                      <>
                        <span
                          className="h-4 w-4 rounded-full border-2 border-background/30 border-t-background animate-spin"
                          aria-hidden="true"
                        />
                        Enviando…
                      </>
                    ) : (
                      <>
                        Enviar mensaje
                        <Send size={15} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
