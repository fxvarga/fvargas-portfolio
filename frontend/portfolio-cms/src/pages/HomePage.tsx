import React from 'react';
import { useCMS } from '../context/CMSContext';
import parseJsonData from '../library/parseJson';

const HomePage = () => {
  const cms = useCMS();
  const hero = parseJsonData(cms?.Hero?.[0]?.jsonData);
  const about = parseJsonData(cms?.About?.[0]?.jsonData);
  console.log('CMS Data:', cms);

  return (
    <div>
      <section>
        <h1>{hero?.heading}</h1>
        <p>{hero?.subheading}</p>
        {hero?.ctaText && <a href={hero?.ctaLink}>{hero?.ctaText}</a>}
      </section>

      <section>
        <h2>{about?.heading}</h2>
        <p>{about?.bio}</p>
        {about?.photo && <img src={about.photo} alt="Fernando" />}
      </section>
    </div>
  );
};

export default HomePage;
