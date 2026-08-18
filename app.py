import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(
    page_title="PySpell Game",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

st.markdown("""
<style>
    .block-container { 
        padding: 0rem; 
        max-width: 100%; 
    }
    header[data-testid="stHeader"], footer { 
        display: none; 
    }
</style>
""", unsafe_allow_html=True)

# Clean, bulletproof iframe component
components.html(
    """
    <iframe 
        src="https://ais-pre-yitkduksphg6bwjai7ixlq-423489132109.us-east5.run.app" 
        style="width: 100%; height: 950px; border: none; border-radius: 8px;"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
    </iframe>
    """,
    height=960,
    scrolling=False
)
