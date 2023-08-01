import { Grid, Card, CardContent, Typography } from '@mui/material';
import React, { FC } from 'react';

interface Props {
  title: string | number;
  subTitle: string;
  icon: JSX.Element;
}

const SummaryTitle: FC<Props> = ({ title, subTitle, icon }) => {
  return (
    <Grid item xs={12} sm={4} md={3}>
      <Card sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
        <CardContent
          sx={{
            width: 50,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {icon}
        </CardContent>
        <CardContent
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            alignItems: 'center',
            justifyContent: 'center',
            '&:last-child': { pb: 2 },
          }}
        >
          <Typography variant="h3">{title}</Typography>
          <Typography lineHeight={1.2}>{subTitle}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default SummaryTitle;
