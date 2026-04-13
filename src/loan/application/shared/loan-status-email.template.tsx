import {
  LineSeparator,
  List,
  MailTemplate,
  Paragraph,
  TemplateComponentProps,
} from 'src/shared/mail';

export type LoanStatusTemplateData = {
  title: string;
  greeting: string;
  intro: string;
  details?: string;
  detailsLabel?: string;
  steps?: string[];
  finalMessage: string;
  contactEmail: string;
  logoUrl?: string;
};

export function LoanStatusEmailTemplate({
  data,
}: TemplateComponentProps<LoanStatusTemplateData>) {
  const steps = data.steps || [];
  const detailsLabel = data.detailsLabel || 'Detalle';
  return (
    <MailTemplate
      title={data.title}
      logoUrl={data.logoUrl}
      logoAlt="Inversiones Murillo Martinez"
    >
      <Paragraph paddingTop={16}>{data.greeting}</Paragraph>
      <Paragraph paddingTop={16}>{data.intro}</Paragraph>
      {data.details ? (
        <Paragraph paddingTop={12}>
          <strong>{detailsLabel}:</strong> {data.details}
        </Paragraph>
      ) : null}
      {steps.length > 0 ? (
        <>
          <Paragraph paddingTop={16}>
            Para continuar, sigue estos pasos:
          </Paragraph>
          <List
            type="ordered"
            items={steps}
            style={{
              marginTop: '8px',
              marginBottom: '0',
              paddingLeft: '18px',
              color: '#111827',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          />
        </>
      ) : null}
      <Paragraph paddingTop={16}>{data.finalMessage}</Paragraph>
      <LineSeparator paddingTop={24} paddingBottom={12} />
      <Paragraph fontSize={13}>
        Si tienes dudas, escríbenos a{' '}
        <a href={`mailto:${data.contactEmail}`}>{data.contactEmail}</a>.
      </Paragraph>
    </MailTemplate>
  );
}
