import {
  ButtonLink,
  LineSeparator,
  MailTemplate,
  NestedTable,
  Paragraph,
  TemplateComponentProps,
} from 'src/shared/mail';

export const translations = {
  es: {
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
    regardsBottom: 'Equipo de PR Ready',
    receivedReason:
      'Ha recibido este correo porque tiene una cuenta de PR Ready.',
  },
  en: {
    subject: 'Reset Password',
    title: 'Reset your Password',
    greeting: (name: string) => `Hello ${name}!`,
    explanation:
      'You have received this email because you requested to reset your current password.',
    instructions: 'Please click the button below to reset your password.',
    button: 'Reset password',
    alternateInstructions:
      'If you do not wish to reset your password, ignore this email and your password will not be modified.',
    regardsTop: 'Thank you,',
    regardsBottom: 'PR Ready Team',
    receivedReason:
      'You have received this email because you have a PR Ready account.',
  },
};

export function RecoverPasswordTemplate({
  lang,
  data,
}: TemplateComponentProps) {
  const { firstName, recoveryLink } = data;
  const t = translations[lang];
  return (
    <MailTemplate lang={lang} title={t.title}>
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
