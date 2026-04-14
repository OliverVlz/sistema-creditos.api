import {
  LineSeparator,
  MailTemplate,
  Paragraph,
  TemplateComponentProps,
} from 'src/shared/mail';

export type ContactSubmissionTemplateData = {
  nombre: string;
  telefono: string;
  email?: string;
  mensaje?: string;
  logoUrl?: string;
};

export function ContactSubmissionTemplate({
  data,
}: TemplateComponentProps<ContactSubmissionTemplateData>) {
  const hasEmail = Boolean(data.email && data.email.trim());
  const hasMessage = Boolean(data.mensaje && data.mensaje.trim());

  return (
    <MailTemplate
      title="Nuevo mensaje desde Contacto"
      logoUrl={data.logoUrl}
      logoAlt="Inversiones Murillo Martinez"
    >
      <Paragraph paddingTop={16}>
        Recibiste un nuevo mensaje desde el formulario de contacto del sitio.
      </Paragraph>
      <Paragraph paddingTop={16}>
        <strong>Nombre:</strong> {data.nombre}
      </Paragraph>
      <Paragraph paddingTop={12}>
        <strong>Telefono:</strong> {data.telefono}
      </Paragraph>
      <Paragraph paddingTop={12}>
        <strong>Correo:</strong> {hasEmail ? data.email : 'No proporcionado'}
      </Paragraph>
      <LineSeparator paddingTop={24} paddingBottom={16} />
      <Paragraph>
        <strong>Mensaje:</strong>
      </Paragraph>
      <Paragraph paddingTop={12}>
        {hasMessage ? data.mensaje : 'Sin mensaje adicional.'}
      </Paragraph>
    </MailTemplate>
  );
}
