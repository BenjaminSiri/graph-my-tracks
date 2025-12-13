import React from 'react';
import styled from 'styled-components';

const StyledDiv = styled.div`
    border: 1px solid #ccc;
    width: 100%;
    height: 100%;
`;


const Graph: React.FC = () => {

    return (
        <StyledDiv>
            Graph Component
        </StyledDiv>
    );
};

export default Graph;