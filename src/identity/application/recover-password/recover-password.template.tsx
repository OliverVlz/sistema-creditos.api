import {
  ButtonLink,
  LineSeparator,
  MailTemplate,
  NestedTable,
  Paragraph,
  TemplateComponentProps,
} from 'src/shared/mail';

export function RecoverPasswordTemplate({
  data,
}: TemplateComponentProps) {
  const { firstName, recoveryLink, logoUrl } = data;
  const t = {
    subject: 'Restablecer contraseña',
    title: 'Restablecer Contraseña',
    greeting: (name: string) => `¡Hola ${name}!`,
    explanation:
      'Has recibido este correo electrónico porque solicitaste restablecer tu contraseña.',
    instructions:
      'Haz clic en el botón de abajo para restablecer tu contraseña.',
    button: 'Restablecer Contraseña',
    alternateInstructions:
      'Si no deseas restablecer tu contraseña, ignora este correo electrónico, tu contraseña no se modificará.',
    regardsTop: 'Gracias,',
    regardsBottom: 'Equipo de Inversiones Murillo Martinez',
    receivedReason:
      'Has recibido este correo porque tienes una cuenta en Inversiones Murillo Martinez.',
  };
  return (
    <MailTemplate
      title={t.title}
      logoUrl={logoUrl}
      logoAlt="Inversiones Murillo Martinez"
    >
      <Paragraph paddingTop={16}>{t.greeting(firstName)}</Paragraph>
      <Paragraph paddingTop={16}>{t.explanation}</Paragraph>
      <Paragraph paddingTop={16}>{t.instructions}</Paragraph>
      <Paragraph paddingTop={24} paddingBottom={8}>
        <NestedTable align="center">
          <ButtonLink href={recoveryLink}>{t.button}</ButtonLink>
        </NestedTable>
      </Paragraph>
      <Paragraph paddingTop={16}>{t.alternateInstructions}</Paragraph>
      <Paragraph paddingTop={24}>{t.regardsTop}</Paragraph>
      <Paragraph>{t.regardsBottom}</Paragraph>
      <LineSeparator paddingTop={48} paddingBottom={16} />
      <Paragraph fontSize={13}>{t.receivedReason}</Paragraph>
    </MailTemplate>
  );
}
