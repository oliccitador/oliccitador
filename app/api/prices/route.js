return NextResponse.json(result);

    } catch (error) {
    console.error('[API/PRICES] Error:', error);
    return NextResponse.json(
        { error: 'Failed to fetch prices' },
        { status: 500 }
    );
}
}
