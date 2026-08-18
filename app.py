import streamlit as st

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

# Modern Streamlit iframe
if hasattr(st, "iframe"):
    st.iframe(
        "https://ais-pre-yitkduksphg6bwjai7ixlq-423489132109.us-east5.run.app",
        height=950,
        scrolling=True
    )
else:
    import streamlit.components.v1 as components
    components.iframe(
        "https://ais-pre-yitkduksphg6bwjai7ixlq-423489132109.us-east5.run.app",
        height=950,
        scrolling=True
    )
